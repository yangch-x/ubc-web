import Http from 'libs/http';

class PackingService {
  //查询
  searchPacking(params) {
    return Http.get(`/packing/search`, params, {
      responseType: 'json',
    });
  }

  //保存修改
  savePacking(params) {
    return Http.post(`/packing/saveOrUpdate`, params, {
      responseType: 'json',
    });
  }
}

const packingService = new PackingService();
export default packingService;
