import { core } from '../Spatial';

export function readCookie(name) {
    var nameEQ = name + "=";
    var ca = String("farmerObj=186718; token=92b39ce8-e7e2-4b12-bf6b-bbd31dd04b91; _ga=GA1.1.536760576.1612264197; _gid=GA1.1.1645977351.1615282019; _gat=1"
    ).split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }

    return null;
}

export function loadFarmerAssets (token, id) {
    core.http.call('getFarmerAssets', {
        url: '/lpis/get/farmerAssets/' + String(token) + '/' + Number(id),
        method: 'get',
        responseType: 'arraybuffer'
    })
    .then(response => console.log(response))
    .catch(err => console.log(err))
} 