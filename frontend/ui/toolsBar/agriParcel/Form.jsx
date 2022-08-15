import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Main, Aux, Admin } from './Steps';

const { Button, Modal, Wizard } = ui;

export function Form ({
    formData, onSubmit, onChange, children, isSimple, className, disableSubmitBtn, showDeleteBtn, onDeleteFn, deleteBtnLabel, deleteBtnClassName,
    formTitle, buttonLabel, schema, uiSchema
}) {
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
        const btnLabel = buttonLabel || 'Зачувај'
        let deleteBtn = null
        if (showDeleteBtn && onDeleteFn) {
            const deleteLabel = deleteBtnLabel || 'Избриши'
            const deleteClassName = deleteBtnClassName || 'cancel'
            deleteBtn = <Button onClick={() => { onDeleteFn() }} size='' className={deleteClassName} >{deleteLabel}</Button>
        }
        return <Modal id='measure-dialog' className={className || ''}
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
                    <React.Fragment>
                        <Button disabled={disableSubmitBtn} type='submit' size='' className='next' >
                            {btnLabel}
                        </Button>
                        {deleteBtn}
                    </React.Fragment>
                </ui.Form>
            </Modal.Body>
        </Modal>;
    }
}

Form.propTypes = {
    formData: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    isSimple: PropTypes.bool,
    disableSubmitBtn: PropTypes.bool,
    showDeleteBtn: PropTypes.bool,
    onDeleteFn: PropTypes.func,
    deleteBtnLabel: PropTypes.string,
    deleteBtnClassName: PropTypes.string,
    className: PropTypes.string,
    formTitle: PropTypes.string,
    buttonLabel: PropTypes.string,
    children: PropTypes.node
}
