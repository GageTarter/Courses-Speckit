<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import facultyServices from "../services/facultyServices.js";
import Utils from "../config/utils.js";

const faculties = ref([]);
const loading = ref(false);
const listError = ref("");
const user = ref(Utils.getStore("user"));

const formDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const formRef = ref(null);
const saving = ref(false);
const deleting = ref(false);
const formError = ref("");
const editing = ref(null);
const facultyToDelete = ref(null);

const form = ref({
  firstName: "",
  lastName: "",
  dept: "",
});

const isAdmin = computed(() => user.value?.role === "admin");

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const formTitle = computed(() =>
  editing.value ? "Edit Faculty" : "Add Faculty",
);
const saveLabel = computed(() =>
  editing.value ? "Save Faculty" : "Create",
);

const firstNameRules = [
  (value) => !!value?.trim() || "First name is required.",
];
const lastNameRules = [
  (value) => !!value?.trim() || "Last name is required.",
];
const deptRules = [
  (value) => !!value?.trim() || "Department is required.",
];

const resetForm = () => {
  form.value = {
    firstName: "",
    lastName: "",
    dept: "",
  };
  formError.value = "";
  editing.value = null;
};

const retrieveFaculties = async () => {
  loading.value = true;
  listError.value = "";

  try {
    const response = await facultyServices.getAll();
    faculties.value = response.data;
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to fetch faculty.";
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  resetForm();
  formDialogOpen.value = true;
};

const openEditDialog = (faculty) => {
  editing.value = faculty;
  form.value = {
    firstName: faculty.firstName,
    lastName: faculty.lastName,
    dept: faculty.dept,
  };
  formError.value = "";
  formDialogOpen.value = true;
};

const closeFormDialog = () => {
  formDialogOpen.value = false;
  resetForm();
};

const openDeleteDialog = (faculty) => {
  facultyToDelete.value = faculty;
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogOpen.value = false;
  facultyToDelete.value = null;
};

const saveFaculty = async () => {
  formError.value = "";
  const { valid } = await formRef.value.validate();

  if (!valid) {
    return;
  }

  saving.value = true;

  const payload = {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName.trim(),
    dept: form.value.dept.trim(),
  };

  try {
    if (editing.value?.id) {
      await facultyServices.update(editing.value.id, payload);
    } else {
      await facultyServices.create(payload);
    }

    closeFormDialog();
    await retrieveFaculties();
  } catch (error) {
    formError.value =
      error.response?.data?.message || "Failed to save faculty.";
  } finally {
    saving.value = false;
  }
};

const confirmDeleteFaculty = async () => {
  if (!facultyToDelete.value?.id) {
    return;
  }

  deleting.value = true;
  listError.value = "";

  try {
    await facultyServices.remove(facultyToDelete.value.id);
    closeDeleteDialog();
    await retrieveFaculties();
  } catch (error) {
    listError.value =
      error.response?.data?.message || "Failed to delete faculty.";
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
  retrieveFaculties();
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});
</script>

<template>
  <v-container class="py-8">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>Faculty</v-card-title>

        <template #append>
          <v-btn
            v-if="isAdmin"
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New Faculty
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
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
          v-if="!loading && faculties.length === 0"
          class="text-body-1"
        >
          No faculty yet. Create your first faculty member.
        </p>

        <v-table v-if="!loading && faculties.length > 0">
          <thead>
            <tr>
              <th class="text-left">First Name</th>
              <th class="text-left">Last Name</th>
              <th class="text-left">Department</th>
              <th
                v-if="isAdmin"
                class="text-left"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="faculty in faculties"
              :key="faculty.id"
            >
              <td>{{ faculty.firstName }}</td>
              <td>{{ faculty.lastName }}</td>
              <td>{{ faculty.dept }}</td>
              <td v-if="isAdmin">
                <div class="d-flex align-center ga-6">
                  <v-icon
                    size="small"
                    aria-label="Edit faculty"
                    @click="openEditDialog(faculty)"
                  >
                    mdi-pencil
                  </v-icon>

                  <v-icon
                    size="small"
                    aria-label="Delete faculty"
                    @click="openDeleteDialog(faculty)"
                  >
                    mdi-trash-can
                  </v-icon>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <v-dialog
      v-model="formDialogOpen"
      max-width="560"
    >
      <v-card rounded="lg">
        <v-card-title>{{ formTitle }}</v-card-title>

        <v-card-text>
          <v-form
            ref="formRef"
            @submit.prevent="saveFaculty"
          >
            <v-text-field
              v-model="form.firstName"
              label="First Name"
              :rules="firstNameRules"
              class="mb-2"
            />

            <v-text-field
              v-model="form.lastName"
              label="Last Name"
              :rules="lastNameRules"
              class="mb-2"
            />

            <v-text-field
              v-model="form.dept"
              label="Department"
              :rules="deptRules"
            />
          </v-form>

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
            @click="saveFaculty"
          >
            {{ saveLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="deleteDialogOpen"
      max-width="420"
    >
      <v-card rounded="lg">
        <v-card-title>Delete Faculty</v-card-title>

        <v-card-text>
          Delete this faculty member?
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
            @click="confirmDeleteFaculty"
          >
            Delete Faculty
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
