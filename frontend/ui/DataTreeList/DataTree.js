import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core'
import TreeMenu from 'react-simple-tree-menu';
import styleList from './style.tree.menu/main.css'

const _DataTree = ({data}) => {
  return <div className={`${styleList['mainHolder']}`} id='dataTree' >

      <TreeMenu data={Object.keys(data).map(key => {
       return {key: key, label: key, nodes: Object.keys(data[key]).map(el => {
        return {key: el, label: el}})
       }
      })
    }
  debounceTime={125}
  disableKeyboard={false}
  hasSearch
  onClickItem={function noRefCheck(e){
    const parent = e.parent
    if (parent.length > 0) {
      const layer = data[parent][e.label]
      spatial.core.Map.fitBounds(layer.getBounds())
    } }}
  resetOpenNodesOnDataUpdate={false} />
  </div>;
} 

spatial.core.store.addState('data', {    
  'Физички блокови': {
},
'Земјоделски парцели': {
    'test1': 'Физички блокови',
},
'Одбрани елементи': {

},
'Мерења': {

},
'Увезени геометрии': {
},
})

_DataTree.propTypes = {
  data: PropTypes.object
}

export const DataTree = spatial.core.connect(state => ({data: state.data}))(_DataTree)


      
     
     
     