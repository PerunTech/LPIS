import { getLabel } from "../Util"

export const lpisSearchFormSchema = () => {
  return {
    schema: {
      properties: {
        ID: {
          title: `${getLabel('lpis_number')}`,
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
