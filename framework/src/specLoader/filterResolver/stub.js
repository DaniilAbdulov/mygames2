const baseFilterProps = ($ref) => [
  {
    type: 'array',
    // eslint-disable-next-line max-len
    description: 'Find all records where the property does match any of the given values. Same as $in',
    'items': {
      $ref
    }
  },
  {
    $ref,
    description: 'Find all records where the property does match of the given value. Same as $eq',
    nullable: true
  }
];

const filterProps = ($ref) => {
  return {
    $eq: {
      $ref,
      nullable: true,
      description: 'Find all records that equal the given property value.'
    },
    $ne: {
      $ref,
      nullable: true,
      description: 'Find all records that do not equal the given property value.'
    },
    $lt: {
      $ref,
      description: 'Find all records where the value is less to a given value.'
    },
    $lte: {
      $ref,
      description: 'Find all records where the value is less and equal to a given value.'
    },
    $gt: {
      $ref,
      description: 'Find all records where the value is more to a given value.'
    },
    $gte: {
      $ref,
      description: 'Find all records where the value is more and equal to a given value.'
    },
    $like: {
      $ref: 'shared://Text',
      description: 'Find all records where the value matches to a given value.'
    },
    $notlike: {
      $ref: 'shared://Text',
      description: 'Find all records where the value not matches to a given value.'
    },
    $ilike: {
      $ref: 'shared://Text',
      description: 'Find all records where the value matches (case insensitive) to a given value.'
    },
    $nin: {
      type: 'array',
      description: 'Find all records where the property does match any of the given values.',
      'items': {
        $ref
      }
    },
    $in: {
      type: 'array',
      description: 'Find all records where the property does not match any of the given values.',
      'items': {
        $ref
      }
    },
    $ts: {
      description: 'Find all records using full text search.',
      oneOf: [
        {
          $ref: 'shared://Text',
          description:
            'Find all records using full text search for given value with default language.'
        },
        {
          description:
            'Find all records using full text search for given value with selected language.',
          type: 'array',
          minItems: 2,
          maxItems: 2,
          'items': {
            $ref: 'shared://Text'
          }
        }
      ]
    },
    $intpf: {
      $ref: 'shared://PositiveInteger',
      description: 'Find all records where the value is int number prefixed by given value.'
    }
  };
};

const andOr = (name) => {
  const $ref = undefined;

  const superBase = {
    type: 'object',
    maxProperties: 1,
    additionalProperties: {
      type: 'object',
      description: 'Поле к которому применяется фильтр',
      oneOf: [
        {
          type: 'object',
          properties: filterProps($ref)
        }
      ].concat(baseFilterProps($ref))
    }
  };

  const baseType = (baseName) => {
    return {
      type: 'array',
      description: baseName,
      minItems: 1,
      'items': {
        oneOf: [
          superBase,
          {
            type: 'array',
            minItems: 1,
            'items': superBase
          }
        ]
      }
    };
  };

  return {
    type: 'array',
    description: `Применяет оператор ${name} к перечисленным полям`,
    example: [],
    'items': {
      'x-disable-converting': true,
      oneOf: [
        {
          ...superBase,
          properties: {
            $and: baseType('Коньюнкция'),
            $or: baseType('Дизьюнкция')
          }
        },
        {
          type: 'array',
          minItems: 1,
          'items': superBase
        }
      ]
    }
  };
};

const baseFilter = (stubData) => {
  const {$ref, example} = stubData;

  const filterPropsObject = filterProps($ref);
  const baseFilterPropsObject = baseFilterProps($ref);

  const baseFilterObject = {
    type: 'object',
    example,
    additionalProperties: false,
    properties: filterPropsObject
  };

  return {
    'x-disable-converting': true,
    oneOf: [baseFilterObject].concat(baseFilterPropsObject)
  };
};

module.exports = {
  andOr,
  baseFilter
};
