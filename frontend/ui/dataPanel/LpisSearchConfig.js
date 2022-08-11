export const lpisSearchFormSchema = () => {
  return {
    schema: {
      properties: {
        ID: {
          title: 'СИЗП број',
          type: 'string',
          default: ''
        }
      },
      type: 'object',
      required: ['ID']
    },
    uiSchema: {

    }
  }
}
