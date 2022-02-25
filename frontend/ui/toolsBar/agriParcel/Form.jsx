import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Main, Aux, Admin } from './Steps';

const { Button, Modal, Wizard } = ui;

export function Form ({ formData, onSubmit, onChange, children, isSimple, formTitle, schema, uiSchema }) {
    if (!isSimple) {
        return <Modal id='measure-dialog'
            show
            backdrop={false}
            enforceFocus={false}
            container={document.getElementsByClassName('control-map')[0]} >
            <Modal.Title>
                <Button disabled className='as-label ap-modal-title' >Земјоделска Парцела</Button>
                {children}
            </Modal.Title>
            <Modal.Body className='ap-modal-body' >
                <Wizard >
                    {[<Main key='main' onChange={onChange} formData={formData} />,
                    <Aux key='aux' onChange={onChange} formData={formData} />,
                    <Admin key='admin' onChange={onChange} onSubmit={onSubmit} formData={formData} />]}
                </Wizard>
            </Modal.Body>
        </Modal>;
    } else {
        const title = formTitle || 'Пополнете ја формата'
        return <Modal id='measure-dialog'
            show
            backdrop={false}
            enforceFocus={false}
            container={document.getElementsByClassName('control-map')[0]} >
            <Modal.Title>
                <Button disabled className='as-label ap-modal-title' >{title}</Button>
                {children}
            </Modal.Title>
            <Modal.Body className='ap-modal-body' >
                <ui.Form
                    schema={schema}
                    uiSchema={uiSchema}
                    formData={{ ...formData }}
                    onSubmit={onSubmit}
                    onChange={onChange} >
                    <Button type='submit' size='' className='next' >
                        Зачувај
                    </Button>
                </ui.Form>
            </Modal.Body>
        </Modal>;
    }
}

Form.propTypes = {
    formData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    isSimple: PropTypes.bool,
    formTitle: PropTypes.string,
    children: PropTypes.node
}
