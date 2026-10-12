<script setup>
import { computed, onMounted, ref } from "vue";
import semesterServices from "../services/semesterServices.js";
import SemesterForm from "../components/SemesterForm.vue";

const emptyForm = () => ({
  name: "",
  startDate: "",
  endDate: "",
});

const dateFormat = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
  : "";

const fixedDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const semesters = ref([]);
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
const semesterToDelete = ref(null);
const deleting = ref(false);

const formTitle = computed(() =>
  isAddMode.value ? "Add Semester" : "Edit Semester",
);
const saveLabel = computed(() =>
  isAddMode.value ? "Create" : "Save Semester",
);

const retrieveSemesters = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const response = await semesterServices.getSemesters();
    semesters.value = response.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch semesters.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  isAddMode.value = true;
  editingId.value = null;
  form.value = emptyForm();
  formError.value = "";
  formDialogOpen.value = true;
};

const openEditDialog = (semester) => {
  isAddMode.value = false;
  editingId.value = semester.id;
  form.value = {
    name: semester.name ?? "",
    startDate: fixedDateInput(semester.startDate),
    endDate: fixedDateInput(semester.endDate),
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  formError.value = "";
  editingId.value = null;
};

const saveSemester = async () => {
  formError.value = "";
  const result = await formRef.value?.validate();

  if (!result?.valid) {
    return;
  }

  saving.value = true;

  const payload = {
    name: form.value.name.trim(),
    startDate: form.value.startDate,
    endDate: form.value.endDate,
  };

  try {
    if (isAddMode.value) {
      await semesterServices.createSemester(payload);
    } else {
      await semesterServices.updateSemester(editingId.value, {
        ...payload,
        semesterId: editingId.value,
      });
    }

    closeFormDialog();
    await retrieveSemesters();
  } catch (error) {
    formError.value =
      error.response?.data?.message ||
      (isAddMode.value
        ? "Failed to create semester."
        : "Failed to update semester.");
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (semester) => {
  semesterToDelete.value = semester;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  semesterToDelete.value = null;
};

const confirmDeleteSemester = async () => {
  if (!semesterToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await semesterServices.deleteSemester(semesterToDelete.value.id);
    closeDeleteDialog();
    await retrieveSemesters();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete semester.";
  } finally {
    deleting.value = false;
  }
};

onMounted(retrieveSemesters);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Semesters</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="openAddDialog"
        >
          + New semester
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-alert v-if="listError" type="error" density="compact" class="mb-4">
      {{ listError }}
    </v-alert>

    <p v-if="!loading && semesters.length === 0" class="text-body-1">
      No semesters yet. Create your first semester.
    </p>

    <v-table v-if="!loading && semesters.length > 0">
      <thead>
        <tr>
          <th class="text-left">Semester name</th>
          <th class="text-left">Start date</th>
          <th class="text-left">End date</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="semester in semesters" :key="semester.id">
          <td>{{ semester.name }}</td>
          <td>{{ dateFormat(semester.startDate) }}</td>
          <td>{{ dateFormat(semester.endDate) }}</td>
          <td>
            <v-icon
              size="small"
              class="mx-4"
              aria-label="Edit semester"
              @click="openEditDialog(semester)"
            >
              mdi-pencil
            </v-icon>
            <v-icon
              size="small"
              class="mx-4"
              aria-label="Delete semester"
              @click="openDeleteDialog(semester)"
            >
              mdi-trash-can
            </v-icon>
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-dialog v-model="formDialogOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <SemesterForm ref="formRef" v-model="form" @submit="saveSemester" />
          <v-alert v-if="formError" type="error" density="compact" class="mt-2">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeFormDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="saveSemester"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-title>Delete Semester</v-card-title>
        <v-card-text>Delete this semester?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="deleting"
            @click="confirmDeleteSemester"
          >
            Delete Semester
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
