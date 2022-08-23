export const landscapeFeaturesSchema = {
  schema: {
    properties: {
      TYPE: {
        enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        enumNames: [
          'Жива ограда', 'Изолирани дрва', 'Дрва во линија', 'Дрва во група', 'Граници (Field margins)',
          'Канал(и) или Ров(ови)', 'Езерце', 'Камени ѕидови', 'Тераси'
        ],
        maxLength: 50,
        title: 'Вид',
        type: 'string',
        default: '1'
      },
      NAME: {
        maxLength: 2000,
        title: 'Назив',
        type: 'string',
        default: ''
      },
    },
    required: ['TYPE', 'NAME'],
    type: 'object',
  },
  uiSchema: {

  }
};
