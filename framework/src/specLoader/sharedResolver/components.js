/* eslint-disable id-blacklist */

module.exports = {
  ['SimpleObject'.toLowerCase()]: {
    type: 'object',
    properties: {},
    example: {}
  },
  ['Boolean'.toLowerCase()]: {
    type: 'boolean',
    example: true
  },
  ['SimpleArray'.toLowerCase()]: {
    type: 'array',
    items: {},
    example: []
  },
  ['Offset'.toLowerCase()]: {
    description: 'Offset of result',
    type: 'integer',
    example: 0,
    default: 0,
    minimum: 0
  },
  ['Limit'.toLowerCase()]: {
    description: 'Limit of result',
    type: 'integer',
    example: 10,
    default: 20,
    minimum: 0,
    maximum: 100
  },
  ['ArrayOfInteger'.toLowerCase()]: {
    type: 'array',
    items: {
      type: 'integer'
    },
    example: [1, 2, 3]
  },
  ['ArrayOfPositiveInteger'.toLowerCase()]: {
    type: 'array',
    items: {
      type: 'integer',
      minimum: 0
    },
    example: [1, 2, 3]
  },
  ['Float'.toLowerCase()]: {
    type: 'number',
    format: 'float',
    example: 0
  },
  ['ArrayOfFloat'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://Float',
      nullable: true
    },
    nullable: true,
    example: [1.0, 22.1, 3.001]
  },

  ['PositiveInteger'.toLowerCase()]: {
    type: 'integer',
    minimum: 0,
    example: 1
  },
  ['Integer'.toLowerCase()]: {
    type: 'integer',
    example: 1
  },
  ['Double'.toLowerCase()]: {
    type: 'number',
    format: 'double',
    example: 0
  },
  ['String'.toLowerCase()]: {
    type: 'string',
    maxLength: 255,
    example: 'String'
  },
  ['NotEmptyString'.toLowerCase()]: {
    type: 'string',
    minLength: 1,
    maxLength: 255,
    example: 'foo'
  },
  ['ArrayOfNotEmptyStrings'.toLowerCase()]: {
    type: 'array',
    default: [],
    items: {
      $ref: 'shared://NotEmptyString'
    },
    example: ['foo', 'bar']
  },
  ['DateTime'.toLowerCase()]: {
    type: 'string',
    format: 'date-time',
    example: '2019-01-25T09:44:52Z'
  },
  ['Date'.toLowerCase()]: {
    type: 'string',
    format: 'date',
    example: '2019-01-25'
  },
  ['DateShortFormat'.toLowerCase()]: {
    type: 'string',
    pattern: '^\\d{2}\.\\d{2}\.\\d{4}$',
    example: '04.02.2020'
  },
  ['Time'.toLowerCase()]: {
    type: 'string',
    format: 'time',
    example: '09:44:52'
  },
  ['DateRange'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://Date',
      nullable: true
    },
    maxItems: 2,
    example: ['2018-12-31', '2019-01-01']
  },
  ['DateTimeRange'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://DateTime',
      nullable: true
    },
    maxItems: 2,
    example: ['2019-01-25T09:44:52Z', '2019-01-30T18:45:53Z']
  },
  ['FloatRange'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://Float',
      nullable: true
    },
    maxItems: 2,
    example: [22.0, 88.9]
  },
  ['NotEmptyText'.toLowerCase()]: {
    type: 'string',
    minLength: 1,
    example: 'Text'
  },
  ['Text'.toLowerCase()]: {
    type: 'string',
    // eslint-disable-next-line max-len
    example: 'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit'
  },
  ['Email'.toLowerCase()]: {
    type: 'string',
    format: 'email',
    example: 'test@etagi.com'
  },
  ['Url'.toLowerCase()]: {
    type: 'string',
    format: 'url',
    nullable: true,
    example: 'https://www.etagi.com/'
  },
  ['Point2D'.toLowerCase()]: {
    type: 'array',
    minItems: 2,
    maxItems: 2,
    items: {
      $ref: 'shared://Double'
    },
    example: [3, 3]
  },
  ['Polygon2D'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://Point2D'
    },
    minItems: 3,
    example: [[1, 1], [3, 1], [3, 3], [1, 1]]
  },
  ['LineString2D'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://Point2D'
    },
    minItems: 2,
    example: [[57.163768, 65.519534], [57.163377, 65.519765], [57.161394, 65.52064]]
  },
  ['MultiLineString2D'.toLowerCase()]: {
    type: 'array',
    items: {
      $ref: 'shared://LineString2D'
    },
    example: [
      [[57.163768, 65.519534], [57.163377, 65.519765], [57.161394, 65.52064]],
      [[57.161219, 65.520799], [57.155508, 65.531666]]
    ]
  },
  ['Uuid'.toLowerCase()]: {
    type: 'string',
    format: 'uuid',
    example: '84526425-35d2-9e05-4fcf-83a7edc648a2'
  },
  ['Predicate'.toLowerCase()]: {
    type: 'number',
    $ref: 'enum://shared/predicate',
    description: 'https://git.etagi.com/ecosystem/documentation/wikis/enums#sharedpredicate'
  },
  ['ArrayOfStrings'.toLowerCase()]: {
    type: 'array',
    default: [],
    items: {
      $ref: 'shared://String'
    },
    example: ['foo', 'bar']
  },
  ['PhoneWithPlus'.toLowerCase()]: {
    type: 'string',
    pattern: '^\\+[0-9]{6,14}$',
    example: '+79227960195'
  },
  ['HexColor'.toLowerCase()]: {
    $ref: 'shared://NotEmptyString',
    pattern: '^#[0-9A-Fa-f]{6,8}$',
    example: '#ff0000'
  },
  ['FilterItem'.toLowerCase()]: {
    description: 'Объект фильтра',
    type: 'object',
    properties: {
      field: {
        description: 'Поле',
        $ref: 'shared://String'
      },
      op: {
        description: 'Оператор',
        $ref: 'shared://String',
        enum: [
          '=',
          '!=',
          '>',
          '>=',
          '<',
          '<=',
          'like',
          'ilike',
          'is',
          'is not',
          'in'
        ]
      },
      value: {
        description: 'Значение',
        nullable: true,
        'x-disable-converting': true,
        oneOf: [
          {
            $ref: 'shared://NotEmptyString',
            nullable: true
          },
          {
            $ref: 'shared://Integer'
          },
          {
            $ref: 'shared://ArrayOfNotEmptyStrings'
          },
          {
            $ref: 'shared://ArrayOfPositiveInteger'
          },
          {
            $ref: 'shared://Boolean'
          }
        ]
      }
    },
    example: {
      field: 'name',
      op: 'ilike',
      value: '%ООО%'
    }
  },
  ['Filter'.toLowerCase()]: {
    description: 'Фильтр',
    type: 'array',
    items: {
      $ref: 'shared://FilterItem'
    },
    example: [{
      field: 'name',
      op: 'ilike',
      value: '%йцу%'
    }]
  },
  ['RichText'.toLowerCase()]: {
    type: 'object',
    description: 'Текст',
    required: [
      'blocks',
      'entityMap'
    ],
    properties: {
      blocks: {
        type: 'array',
        description: 'Блоки текста',
        items: {
          type: 'object',
          description: 'Блок текста',
          properties: {
            key: {
              $ref: 'shared://NotEmptyString',
              description: 'Ключ'
            },
            text: {
              $ref: 'shared://Text',
              description: 'Текст'
            },
            type: {
              $ref: 'enum://wysiwyg/blockTypes',
              description: 'Тип',
              example: 'unstyled'
            },
            depth: {
              $ref: 'shared://PositiveInteger',
              description: 'Глубина',
              example: 0
            },
            inlineStyleRanges: {
              type: 'array',
              description: 'Стили',
              items: {
                type: 'object',
                properties: {
                  offset: {
                    $ref: 'shared://PositiveInteger',
                    description: 'Оффсет',
                    example: 0
                  },
                  length: {
                    $ref: 'shared://PositiveInteger',
                    description: 'Длина',
                    example: 6
                  },
                  style: {
                    $ref: 'enum://wysiwyg/inlineStyles',
                    description: 'Стиль',
                    example: 'BOLD'
                  }
                }
              }
            },
            entityRanges: {
              type: 'array',
              description: 'Сущности',
              items: {
                type: 'object',
                properties: {
                  offset: {
                    $ref: 'shared://PositiveInteger',
                    description: 'Оффсет',
                    example: 0
                  },
                  length: {
                    $ref: 'shared://PositiveInteger',
                    description: 'Длина',
                    example: 6
                  },
                  key: {
                    $ref: 'shared://PositiveInteger',
                    description: 'Ключ',
                    example: 0
                  }
                }
              }
            },
            data: {
              $ref: 'shared://SimpleObject',
              description: 'Данные'
            }
          }
        }
      },
      entityMap: {
        $ref: 'shared://SimpleObject',
        description: 'Сопоставление сущностей',
        example: {
          type: 'mention',
          mutability: 'IMMUTABLE',
          data: {
            mention: {
              id: 1,
              name: String,
              label: String,
              lastName: String,
              firstName: String,
              middleName: String,
              entity: 1
            }
          }
        }
      }
    }
  },
  ['ShortTime'.toLowerCase()]: {
    type: 'string',
    pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
    example: '09:44'
  },
  ['PlateText'.toLowerCase()]: {
    type: 'array',
    description: 'Формат плейта',
    items: {
      type: 'object',
      properties: {
        type: {
          $ref: 'shared://String',
          description: 'Тип ноды'
        },
        children: {
          type: 'array',
          description: 'Контент ноды',
          items: {
            type: 'object',
            properties: {
              text: {
                $ref: 'shared://Text',
                description: 'Текст'
              },
              strikethrough: {
                $ref: 'shared://Boolean',
                description: 'Зачеркивание'
              },
              bold: {
                $ref: 'shared://Boolean',
                description: 'Жирность'
              },
              underline: {
                $ref: 'shared://Boolean',
                description: 'Подчеркивание'
              },
              italic: {
                $ref: 'shared://Boolean',
                description: 'Курсив'
              }
            }
          }
        }
      }
    }
  },
  ['GeoLon'.toLowerCase()]: {
    type: 'string',
    description: 'Координаты (Долгота)',
    pattern: '^-?(180(\\.0+)?|((1[0-7]\\d)|([1-9]?\\d))(\\.\\d+)?)$',
    example: '180'
  },
  ['GeoLat'.toLowerCase()]: {
    type: 'string',
    description: 'Координаты (Широта)',
    pattern: '^-?(90(\\.0+)?|[1-8]?\\d(\\.\\d+)?)$',
    example: '90'
  }
};
