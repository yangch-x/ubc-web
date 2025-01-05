import Http from 'libs/http';

class ProjectionService {
  //查询
  search(params) {
    return Http.post(`/projection/search`, params);
  }

  saveOrUpdate(params) {
    return Http.post(`projection/saveOrUpdate`, params);
  }

  remove(params) {
    return Http.delete(`projection/remove`, params);
  }

  batchremove(params) {
    return Http.post(`projection/batch_remove`, params);
  }
}

const projectionService = new ProjectionService();
export default projectionService;
