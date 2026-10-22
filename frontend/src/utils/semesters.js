export const offeredSemesters = [
  { id: 1, name: "Fall" },
  { id: 4, name: "Winter" },
  { id: 2, name: "Spring" },
  { id: 3, name: "Summer" },
];

export const semesterName = (id) =>
  offeredSemesters.find((semester) => semester.id === Number(id))?.name ?? "";
