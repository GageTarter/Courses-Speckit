import apiClient from "./services.js";

const semesterServices = {
    getSemesters() {
        return apiClient.get("/semesters");
    },

    createSemester(semester) {
        return apiClient.post("/semesters", semester);
    },

    updateSemester(semester) {
        return apiClient.put("/semesters", semester);
    },

    deleteSemester(semester) {
        return apiClient.delete("/semesters", semester);
    }
};

export default semesterServices;