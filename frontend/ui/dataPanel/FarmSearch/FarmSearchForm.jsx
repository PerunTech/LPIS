import { React, PropTypes } from 'perun-core'
import { ui } from '../../../Spatial';
import { getLabel } from '../../Util';

const { Form, Button } = ui;

const FarmSearchForm = ({ onChange, onSubmit, formData, loading }) => {
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
        ...loading && { FULL_NAME: { 'ui:readonly': true } }
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
        <Button type='submit' className='farm-search-btn' size='' disabled={loading}>{getLabel('search')}</Button>
      </div>
    </Form>
  )
}

FarmSearchForm.propTypes = {
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  formData: PropTypes.object,
  loading: PropTypes.bool,
}

export default FarmSearchForm
