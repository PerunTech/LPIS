import { React } from 'perun-core'
import { ui } from '../../../Spatial';
import { getLabel } from '../../Util';

const { Form, Button } = ui;

const FarmSearchForm = ({ onChange, onSubmit, formData }) => {
  const getFarmSearchSchema = () => {
    return {
      schema: {
        properties: {
          FULL_NAME: {
            title: `${getLabel('farm_name')}`,
            type: 'string',
            default: ''
          }
        },
        type: 'object',
        required: ['FULL_NAME']
      },
      uiSchema: {

      }
    }
  }

  return (
    <Form
      className='farm-search-form'
      schema={getFarmSearchSchema().schema}
      uiSchema={getFarmSearchSchema().uiSchema}
      formData={formData}
      onSubmit={onSubmit}
      onChange={onChange}
    >
      <div className='farm-search-btn-container'>
        <Button type='submit' className='farm-search-btn' size=''>{getLabel('search')}</Button>
      </div>
    </Form>
  )
}

export default FarmSearchForm
