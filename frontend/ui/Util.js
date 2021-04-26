export function readCookie(name) {
    var nameEQ = name + "=";
    // String("farmerObj=20348156; token=92b39ce8-e7e2-4b12-bf6b-bbd31dd04b91; _ga=GA1.1.536760576.1612264197; _gid=GA1.1.1645977351.1615282019; _gat=1"
    var ca = window.parent.document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }

    return null;
}