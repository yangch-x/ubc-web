import Http from 'libs/http';

class PackingService {
  //查询
  generatePackingInfo(params) {
    return Http.post(`packing/select`, params, {
      responseType: 'json',
    });
  }
}

const packingService = new PackingService();
export default packingService;
