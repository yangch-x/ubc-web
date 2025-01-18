import Http from 'libs/http';

class ProjectionService {
  //查询
  search(params) {
    return Http.post(`/projectionPo/search`, params);
  }

  saveOrUpdate(params) {
    return Http.post(`projectionPo/saveOrUpdate`, params);
  }

  remove(params) {
    return Http.delete(`projectionPo/remove`, params);
  }

  batchremove(params) {
    return Http.post(`projectionPo/batch_remove`, params);
  }

  //下载po
  downloadProjectionPo(params) {
    return Http.post(
      `/projectionPo/download`,
      {
        ids: params.selection.map((item) => item.id),
      },
      { responseType: 'blob' }
    );
  }
}

const projectionService = new ProjectionService();
export default projectionService;
