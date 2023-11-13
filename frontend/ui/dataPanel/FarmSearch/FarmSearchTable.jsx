import { React, PropTypes, elements } from 'perun-core';
import { core, data } from '../../../Spatial';
import { config as apConfig } from '../../toolsBar/agriParcel/Config'
import { getLabel } from '../../Util';

const { factory, Map, http } = core;
const { geobuf, protobuf } = data;
const { ReactBootstrap, alertUser } = elements;
const { Table } = ReactBootstrap;

const FarmSearchTable = ({ farmData }) => {
  const onRowClick = (objectId) => {
    const url = `/lpis/get/farmerAssets/{init.token}/${objectId}/AGRI_PARCEL`
    http.call('getFarmMapAssets', { url, method: 'get', responseType: 'arraybuffer' }).then(response => {
      // Clean-up all layers from the map
      Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
          Map.removeLayer(layer);
        }
      });
      // Decode the data and visualize it on the map
      const data = geobuf.decode(protobuf(response));
      const geojson = factory.geoJSON(data, apConfig);
      const layers = geojson.getLayers();
      if (layers.length > 0) {
        layers.forEach(layer => {
          layer.addTo(Map)
        });
        Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', `${getLabel('something_went_wrong')}`)
    })
  }

  const generateTableColumns = () => {
    const columns = ['Status', 'Full name', 'Identification number']
    return columns.map((column, i) => {
      return (
        <th key={i + 1}>{column}</th>
      )
    })
  }

  const generateTableRows = () => {
    return farmData.map(farm => {
      return (
        <tr key={farm['FARM.OBJECT_ID']} className='farm-search-table-row' onClick={() => onRowClick(farm['FARM.OBJECT_ID'])}>
          <td>{farm['FARM.STATUS']}</td>
          <td>{farm['FARM.FULL_NAME']}</td>
          <td>{farm['FARM.FIC']}</td>
        </tr>
      )
    })
  }

  return (
    <div className='farm-search-table-container'>
      {farmData && Array.isArray(farmData) && farmData.length > 0 ? (
        <Table striped bordered hover className='farm-search-table'>
          <thead className='farm-search-table-header sticky-top'>
            <tr>
              {generateTableColumns()}
            </tr>
          </thead>
          <tbody>
            {generateTableRows()}
          </tbody>
        </Table>
      ) : (
        <span className='farm-search-no-data-found'>{getLabel('no_data_found')}</span>
      )}
    </div>
  )
}

FarmSearchTable.propTypes = {
  farmData: PropTypes.array,
}

export default FarmSearchTable
