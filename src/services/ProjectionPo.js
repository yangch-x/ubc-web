import Http from 'libs/http';

class ProjectionService {
  //查询
  search(params) {
    return Http.post(`/projectionPo/search`, params);
  }

  saveOrUpdate(params) {
    return Http.post(`projectionPo/saveOrUpdate`, params);
  }

  // 更新表格编辑字段
  updateFields(params) {
    return Http.post(`projectionPo/updateFields`, params);
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

  //下载po pdf
  downloadProjectionPoPdf(params) {
    return Http.post(
      `/projectionPo/download/pdf`,
      {
        ids: params.selection.map((item) => item.id),
      },
      {
        responseType: 'blob',
        fullResponse: true, // 返回完整的响应对象，包括headers
      }
    );
  }
}

const projectionService = new ProjectionService();
export default projectionService;
