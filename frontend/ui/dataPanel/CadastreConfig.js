const cadSectors = {
  'Берово': 1,
  'Битола': 2,
  'Валандово': 4,
  'Велес': 29,
  'Виница': 5,
  'Гевгелија': 6,
  'Гостивар': 7,
  'Дебар': 8,
  'Делчево': 9,
  'Демир Хисар': 10,
  'Кавадарци': 11,
  'Кичево': 12,
  'Кочани': 13,
  'Кратово': 14,
  'Крива Паланка': 15,
  'Крушево': 16,
  'Куманово': 17,
  'Македонски Брод': 3,
  'Неготино': 18,
  'Охрид': 19,
  'Прилеп': 20,
  'Пробиштип': 21,
  'Радовиш': 22,
  'Ресен': 23,
  'Свети Николе': 24,
  'Скопје': 25,
  'Струга': 26,
  'Струмица': 27,
  'Тетово': 28,
  'Штип': 30
}

export const cadastreSearchFormSchema = cadMunicipalities => {
  let requiredFields = ['CADASTRAL_SECTOR']
  if (cadMunicipalities) {
    requiredFields.push('CADASTRAL_MUNICIPALITY')
  }
  return {
    schema: {
      properties: {
        CADASTRAL_SECTOR: {
          enum: Object.values(cadSectors),
          enumNames: Object.keys(cadSectors),
          title: 'Катастарско одделение',
          type: 'string',
          default: ''
        },
        ...cadMunicipalities && {
          CADASTRAL_MUNICIPALITY: {
            enum: Object.keys(cadMunicipalities),
            enumNames: Object.values(cadMunicipalities),
            title: 'Катастарска општина',
            type: 'string',
            default: ''
          }
        }
      },
      type: 'object',
      required: requiredFields
    },
    uiSchema: {

    }
  }
}
