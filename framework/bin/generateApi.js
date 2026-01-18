const ts = require('typescript');

const {name} = require('../package.json');

const printAst = (ast) => ts
  .createPrinter({newLine: ts.NewLineKind.LineFeed})
  .printNode(ts.EmitHint.Unspecified, ast);

const convertOpenApiToAst = (spec, ctx) => {
  ctx.enums = new Map();

  const operations = [];

  for (const path in spec.paths) {
    const {parameters, ...methods} = spec.paths[path];
    const pathParameters = visitParametersSchema(parameters ?? [], ctx);

    for (const method in methods) {
      const operation = methods[method];

      if (typeof operation === 'object') {
        operations.push(visitOperationSchema(operation, pathParameters, ctx));
      }
    }
  }

  return ts.factory.createSourceFile([
    ts.factory.createImportDeclaration(
      undefined,
      undefined,
      undefined,
      PACKAGE_NAME
    ),
    ...ctx.enums.values(),
    ts.factory.createModuleDeclaration(
      undefined,
      [ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
      PACKAGE_NAME,
      ts.factory.createModuleBlock([ts.factory.createInterfaceDeclaration(
        undefined,
        undefined,
        'Services',
        undefined,
        undefined,
        [ts.factory.createPropertySignature(
          undefined,
          makePropIndexNode(spec.info.title.toLowerCase()),
          undefined,
          ts.factory.createTypeLiteralNode(operations)
        )]
      )])
    )
  ]);
};

const visitOperationSchema = (schema, pathParameters, ctx) => {
  const properties = [];

  const params = pathParameters
    .concat(visitParametersSchema(schema.parameters ?? [], ctx));
  const body = schema.requestBody
    ?.content
    ?.['application/json']
    ?.schema;
  const result = (schema.responses?.['200'] ?? schema.responses?.['2XX'])
    ?.content
    ?.['application/json']
    ?.schema;

  properties.push(ts.factory.createPropertySignature(
    undefined,
    makePropIndexNode('params'),
    undefined,
    ts.factory.createTypeLiteralNode(params)
  ));
  properties.push(ts.factory.createPropertySignature(
    undefined,
    makePropIndexNode('body'),
    undefined,
    body ? visitObjectSchema(body, {...ctx, place: 'request'}) : NEVER
  ));
  properties.push(ts.factory.createPropertySignature(
    undefined,
    makePropIndexNode('result'),
    undefined,
    result ? visitObjectSchema(result, {...ctx, place: 'response'}) : VOID
  ));

  return ts.factory.createPropertySignature(
    undefined,
    schema.operationId,
    undefined,
    ts.factory.createTypeLiteralNode(properties)
  );
};

const visitParametersSchema = (parameters, ctx) => parameters.map((parameter) => {
  const innerSchema = parameter.schema;
  const isRequired = !!parameter.required;
  const isServer = ctx.type === 'server';
  const hasDefault = 'default' in innerSchema;

  return ts.factory.createPropertySignature(
    undefined,
    makePropIndexNode(parameter.name),
    !isRequired && (!hasDefault || !isServer) ?
      QUESTION_TOKEN :
      undefined,
    visitObjectSchema(innerSchema, ctx)
  );
});

const visitObjectSchema = (schema, ctx) => {
  if (!schema) {
    return NEVER;
  }
  if (Array.isArray(schema) || typeof schema !== 'object') {
    ctx.logger.warn(
      'Object schema is not satisfies SchemaObject specification. ' +
      'Would be replaced with unknown.'
    );

    return UNKNOWN;
  }
  if (
    Array.isArray(schema.enum) &&
    schema.type !== 'object' &&
    !schema.properties &&
    !schema.additionalProperties
  ) {
    let enumNode;

    if (schema['x-enum-component'] && schema['x-enum-name']) {
      const enumComponent = schema['x-enum-component'];
      const enumName = schema['x-enum-name'];
      const enumItems = schema['x-enum-items'];

      if (!ctx.enums.has(enumComponent)) {
        ctx.enums.set(enumComponent, ts.factory.createImportDeclaration(
          undefined,
          undefined,
          ts.factory.createImportSpecifier(
            true,
            ts.factory.createIdentifier('*'),
            ts.factory.createIdentifier(enumComponent)
          ),
          ts.factory.createStringLiteral(`@ecosystem/enums/${enumComponent}`)
        ));
      }

      enumNode = ts.factory.createIndexedAccessTypeNode(
        makeTypeOfNode(`${enumComponent}.${enumName}`),
        enumItems ?
          makeUnionNode(enumItems.map(makeLiteralNode)) :
          makeKeyOfNode(makeTypeOfNode(`${enumComponent}.${enumName}`))
      );
    } else {
      enumNode = makeUnionNode(schema.enum.map(makeLiteralNode));
    }

    return schema.nullable ? makeNullableNode(enumNode) : enumNode;
  }

  let finalType = makeNodeByType(schema, ctx);

  if (schema.allOf?.length) {
    finalType = makeIntersectionNode([
      ...finalType ? [finalType] : [],
      ...collectCompositions(schema.allOf, schema.required, ctx)
    ]);
  }
  if (schema.anyOf?.length) {
    finalType = makeUnionNode([
      ...finalType ? [finalType] : [],
      ...collectCompositions(schema.anyOf, schema.required, ctx)
    ]);
  }

  const oneOfs = schema.oneOf || schema.type === 'object' && schema.enum || [];

  if (oneOfs.length) {
    const oneOf = collectCompositions(oneOfs, schema.required, ctx);

    finalType = oneOf.every(isPrimitive) ?
      makeUnionNode([
        ...finalType ? [finalType] : [],
        ...oneOf
      ]) :
      makeIntersectionNode([
        ...finalType ? [finalType] : [],
        makeUnionNode(oneOf)
      ]);
  }

  if (!finalType) {
    return UNKNOWN;
  }

  return schema.nullable ?
    makeNullableNode(finalType) :
    finalType;
};

const collectCompositions = (elements, required, ctx) => {
  const output = [];

  for (const element of elements) {
    if (element && typeof element === 'object') {
      const itemRequired = required ? [...required] : [];

      if (Array.isArray(element.required)) {
        itemRequired.push(...element.required);
      }

      output.push(visitObjectSchema({...element, required: itemRequired}, ctx));
    } else {
      output.push(visitObjectSchema(element, ctx));
    }
  }

  return output;
};

const makeNodeByType = (schema, ctx) => {
  switch (schema.type) {
    case 'null':
      return NULL;
    case 'string': {
      const isDateFormat = ['date', 'date-time'].includes(schema.format);
      const isServerResponse = ctx.type === 'server' && ctx.place === 'response';
      const isClientRequest = ctx.type === 'client' && ctx.place === 'request';

      return isDateFormat && (isServerResponse || isClientRequest) ?
        makeUnionNode([STRING, DATE]) :
        STRING;
    }
    case 'number':
    case 'integer':
      return NUMBER;
    case 'boolean':
      return BOOLEAN;
    case 'array': {
      const elementType = schema.items ?
        visitObjectSchema(schema.items, ctx) :
        UNKNOWN;
      const min = Math.max(0, schema.minItems || 0);
      const max = typeof schema.maxItems === 'number' && schema.maxItems >= min ?
        schema.maxItems :
        undefined;

      if (!min && !max) {
        return ts.factory.createArrayTypeNode(elementType);
      }
      if (min && !max) {
        const elements = Array.from({length: min}, () => elementType);

        return ts.factory.createTupleTypeNode([
          ...elements,
          ts.factory.createRestTypeNode(ts.factory.createArrayTypeNode(elementType))
        ]);
      }

      const members = [];

      for (let i = 0; i <= max - min; i++) {
        const elements = [];

        for (let j = 0; j < i + min; j++) {
          elements.push(elementType);
        }

        members.push(ts.factory.createTupleTypeNode(elements));
      }

      return makeUnionNode(members);
    }
    case 'object': {
      const nodes = [];
      const properties = [];

      for (const property in schema.properties ?? {}) {
        const innerSchema = schema.properties[property];
        const isRequired = schema.required?.includes?.(property);
        const hasDefault = typeof innerSchema === 'object' && 'default' in innerSchema;
        const isServer = ctx.type === 'server';

        properties.push(ts.factory.createPropertySignature(
          undefined,
          makePropIndexNode(property),
          !isRequired && (!hasDefault || !isServer) ?
            QUESTION_TOKEN :
            undefined,
          visitObjectSchema(innerSchema, ctx)
        ));
      }

      nodes.push(ts.factory.createTypeLiteralNode(properties));

      if (!('additionalProperties' in schema) || schema.additionalProperties !== false) {
        const hasExplicitAdditionalProperties =
          typeof schema.additionalProperties === 'object' &&
          schema.additionalProperties &&
          Object.keys(schema.additionalProperties).length;
        let type = hasExplicitAdditionalProperties ?
          visitObjectSchema(schema.additionalProperties, ctx) :
          UNKNOWN;

        if (type.kind !== ts.SyntaxKind.UnknownKeyword) {
          type = makeUnionNode([type, UNDEFINED]);
        }

        nodes.push(ts.factory.createTypeLiteralNode([ts.factory.createIndexSignature(
          undefined,
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              undefined,
              'key',
              undefined,
              STRING
            )
          ],
          type
        )]));
      }

      return makeIntersectionNode(nodes);
    }
  }
};

const makeLiteralNode = (value) => {
  if (typeof value === 'string') {
    return ts.factory.createIdentifier(JSON.stringify(value));
  }
  if (typeof value === 'number') {
    return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(value));
  }
  if (typeof value === 'boolean') {
    return value === true ? TRUE : FALSE;
  }
  if (value === null) {
    return NULL;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ts.factory.createArrayTypeNode(NEVER);
    }

    return ts.factory.createTupleTypeNode(value.map(makeLiteralNode));
  }
  if (typeof value === 'object') {
    const keys = [];

    for (const key in value) {
      keys.push(
        ts.factory.createPropertySignature(
          undefined,
          makePropIndexNode(key),
          undefined,
          makeLiteralNode(value[key])
        )
      );
    }

    return keys.length ?
      ts.factory.createTypeLiteralNode(keys) :
      makeRecordNode(STRING, NEVER);
  }

  return UNKNOWN;
};

const makePropIndexNode = (index) => {
  const isNumber = typeof index === 'number' && index >= 0;
  const isStringAsNumber = typeof index === 'string' &&
    String(Number(index)) === index &&
    index[0] !== '-';

  if (isNumber || isStringAsNumber) {
    return ts.factory.createNumericLiteral(index);
  }

  return typeof index === 'string' && JS_PROPERTY_INDEX_RE.test(index) ?
    ts.factory.createIdentifier(index) :
    ts.factory.createStringLiteral(String(index));
};

const makeUnionNode = (types) => {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }

  return ts.factory.createUnionTypeNode(uniqueTypes(types));
};

const makeIntersectionNode = (types) => {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }

  return ts.factory.createIntersectionTypeNode(uniqueTypes(types));
};

const makeRecordNode = (key, value) => ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier('Record'),
  [key, value]
);

const makeKeyOfNode = (type) => ts.factory.createTypeOperatorNode(
  ts.SyntaxKind.KeyOfKeyword,
  type
);

const makeTypeOfNode = (literal) => ts.factory.createTypeOfExpression(
  ts.factory.createIdentifier(literal)
);

const makeNullableNode = (type) => ts.factory.createUnionTypeNode([type, NULL]);

const uniqueTypes = (types) => {
  const encounteredTypes = new Set();
  const filteredTypes = [];

  for (const t of types) {
    if (!('text' in (t.literal ?? t))) {
      const {kind} = t.literal ?? t;

      if (encounteredTypes.has(kind)) {
        continue;
      }
      if (isPrimitive(t)) {
        encounteredTypes.add(kind);
      }
    }

    filteredTypes.push(t);
  }

  return filteredTypes;
};

const isPrimitive = (type) => {
  if (!type) {
    return true;
  }

  return (
    ts.SyntaxKind[type.kind] === 'BooleanKeyword' ||
    ts.SyntaxKind[type.kind] === 'NeverKeyword' ||
    ts.SyntaxKind[type.kind] === 'NullKeyword' ||
    ts.SyntaxKind[type.kind] === 'NumberKeyword' ||
    ts.SyntaxKind[type.kind] === 'StringKeyword' ||
    ts.SyntaxKind[type.kind] === 'UndefinedKeyword' ||
    'literal' in type && isPrimitive(type.literal)
  );
};

const BOOLEAN = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
const FALSE = ts.factory.createLiteralTypeNode(ts.factory.createFalse());
const TRUE = ts.factory.createLiteralTypeNode(ts.factory.createTrue());
const NEVER = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull());
const NUMBER = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
const QUESTION_TOKEN = ts.factory.createToken(ts.SyntaxKind.QuestionToken);
const STRING = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
const UNDEFINED = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
const UNKNOWN = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
const VOID = ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
const PACKAGE_NAME = ts.factory.createStringLiteral(name);
const DATE = ts.factory.createTypeReferenceNode('Date');

const JS_PROPERTY_INDEX_RE = /^[A-Za-z_$][A-Za-z_$0-9]*$/;

module.exports = {convertOpenApiToAst, printAst};
