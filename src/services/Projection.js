import Http from "libs/http"

class ProjectionService {
    //查询
    select(params) {
        return Http.get(`packing/select`, params, {
            responseType: "json",
        })
    }
}

const projectionService = new ProjectionService()
export default projectionService
