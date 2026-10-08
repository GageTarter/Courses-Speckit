<script setup>
import { computed, onMounted, ref } from "vue";
import sectionServices from "../services/sectionServices.js";
import facultyServices from "../services/facultyServices.js";
import { getCourses } from "../services/courseCatalog.js";
import { semesterName } from "../utils/semesters.js";
import SectionForm from "../components/SectionForm.vue";

const emptyForm = () => ({
  sectionNumber: "",
  semesterId: "",
  courseId: "",
  facultyId: "",
  daysOfWeek: [],
  startTime: "",
  endTime: "",
});

const sections = ref([]);
const courses = ref([]);
const faculties = ref([]);
const loading = ref(false);
const listError = ref("");
const formDialogOpen = ref(false);
const isAddMode = ref(true);
const form = ref(emptyForm());
const formRef = ref(null);
const formError = ref("");
const saving = ref(false);
const editingId = ref(null);
const deleteDialogOpen = ref(false);
const sectionToDelete = ref(null);
const deleting = ref(false);

const formatSectionNumber = (value) => String(value).padStart(2, "0");

const courseLabel = (courseId) => {
  const course = courses.value.find((item) => item.id === Number(courseId));
  return course?.courseID || courseId;
};

const facultyLabel = (facultyId) => {
  const faculty = faculties.value.find((item) => item.id === Number(facultyId));

  if (!faculty) {
    return facultyId;
  }

  return `${faculty.firstName} ${faculty.lastName}`.trim();
};

const loadCourses = async () => {
  try {
    const response = await getCourses();
    courses.value = response.data || [];
  } catch {
    courses.value = [];
  }
};

const loadFaculties = async () => {
  try {
    const response = await facultyServices.getAll();
    faculties.value = response.data || [];
  } catch {
    faculties.value = [];
  }
};

const formTitle = computed(() =>
  isAddMode.value ? "Add Section" : "Edit Section",
);

const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Section",
);

const retrieveSections = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const response = await sectionServices.getSections();
    sections.value = response.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch sections.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  loadCourses();
  loadFaculties();
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (section) => {
  loadCourses();
  loadFaculties();
  isAddMode.value = false;
  editingId.value = section.id;

  form.value = {
    sectionNumber: formatSectionNumber(section.sectionNumber),
    semesterId: section.semesterId ?? "",
    courseId: section.courseId ?? "",
    facultyId: section.facultyId ?? "",
    daysOfWeek: Array.isArray(section.daysOfWeek)
      ? section.daysOfWeek
      : section.daysOfWeek
        ? section.daysOfWeek.split(",")
        : [],
    startTime: section.startTime ?? "",
    endTime: section.endTime ?? "",
  };

  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveSection = async () => {
  formError.value = "";

  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    sectionNumber: Number(form.value.sectionNumber),
    semesterId: Number(form.value.semesterId),
    courseId: Number(form.value.courseId),
    facultyId: Number(form.value.facultyId),
    daysOfWeek: form.value.daysOfWeek,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
  };

  try {
    if (isAddMode.value) {
      await sectionServices.createSection(payload);
    } else {
      await sectionServices.updateSection(editingId.value, {
        ...payload,
        sectionId: editingId.value,
      });
    }

    closeFormDialog();
    await retrieveSections();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create section."
        : "Failed to update section.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (section) => {
  sectionToDelete.value = section;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  sectionToDelete.value = null;
};

const confirmDeleteSection = async () => {
  if (!sectionToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await sectionServices.deleteSection(sectionToDelete.value.id);
    closeDeleteDialog();
    await retrieveSections();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete section.";
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  retrieveSections();
  loadCourses();
  loadFaculties();
});
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Sections</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="openAddDialog"
        >
          + New Section
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear
      v-if="loading"
      indeterminate
      class="mb-4"
    />

    <v-alert
      v-if="listError"
      type="error"
      density="compact"
      class="mb-4"
    >
      {{ listError }}
    </v-alert>

    <p
      v-if="!loading && sections.length === 0"
      class="text-body-1"
    >
      No sections yet. Create your first section.
    </p>

    <v-table v-if="!loading && sections.length > 0">
      <thead>
        <tr>
          <th class="text-left">Section Number</th>
          <th class="text-left">Semester</th>
          <th class="text-left">Course</th>
          <th class="text-left">Faculty</th>
          <th class="text-left">Days of the Week</th>
          <th class="text-left">Start Time</th>
          <th class="text-left">End Time</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="section in sections"
          :key="section.id"
        >
          <td>
            {{ formatSectionNumber(section.sectionNumber) }}
          </td>

          <td>{{ semesterName(section.semesterId) }}</td>

          <td>{{ courseLabel(section.courseId) }}</td>

          <td>{{ facultyLabel(section.facultyId) }}</td>

          <td>
            {{
              Array.isArray(section.daysOfWeek)
                ? section.daysOfWeek.join(", ")
                : section.daysOfWeek
            }}
          </td>

          <td>{{ section.startTime }}</td>

          <td>{{ section.endTime }}</td>

          <td>
            <div class="d-flex align-center ga-6">
              <v-icon
                size="small"
                aria-label="Edit section"
                @click="openEditDialog(section)"
              >
                mdi-pencil
              </v-icon>

              <v-icon
                size="small"
                aria-label="Delete section"
                @click="openDeleteDialog(section)"
              >
                mdi-trash-can
              </v-icon>
            </div>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- ADD / EDIT SECTION -->
    <v-dialog
      v-model="formDialogOpen"
      max-width="600"
    >
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>

        <v-card-text>
          <SectionForm
            ref="formRef"
            v-model="form"
            :courses="courses"
            :faculties="faculties"
            @submit="saveSection"
          />

          <v-alert
            v-if="formError"
            type="error"
            density="compact"
            class="mt-2"
          >
            {{ formError }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            variant="text"
            @click="closeFormDialog"
          >
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveSection"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DELETE SECTION -->
    <v-dialog
      v-model="deleteDialogOpen"
      max-width="420"
    >
      <v-card rounded="lg">
        <v-card-title>Delete Section</v-card-title>

        <v-card-text>
          Delete this section?
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            variant="text"
            @click="closeDeleteDialog"
          >
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteSection"
          >
            Delete Section
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>