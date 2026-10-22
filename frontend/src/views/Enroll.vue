<script setup>
import { computed, onMounted, ref, watch } from "vue";
import catalogServices from "../services/catalogServices.js";
import enrollmentServices from "../services/enrollmentServices.js";

const semesters = ref([]);
const selectedSemesterId = ref(null);
const sections = ref([]);
const enrollments = ref([]);
const loadingCatalog = ref(false);
const loadingTable = ref(false);
const error = ref("");
const enrollingId = ref(null);
const dropTarget = ref(null);
const dropping = ref(false);

const enrolledSectionIds = computed(
  () => new Set(enrollments.value.map((row) => row.sectionId))
);

const sortedSections = computed(() =>
  [...sections.value].sort((a, b) => {
    const codeA = a.course?.code ?? "";
    const codeB = b.course?.code ?? "";
    const byCode = codeA.localeCompare(codeB, undefined, { sensitivity: "base" });

    if (byCode !== 0) {
      return byCode;
    }

    const titleA = a.course?.title ?? "";
    const titleB = b.course?.title ?? "";
    const byTitle = titleA.localeCompare(titleB, undefined, { sensitivity: "base" });

    if (byTitle !== 0) {
      return byTitle;
    }

    return String(a.sectionNumber).localeCompare(
      String(b.sectionNumber),
      undefined,
      { numeric: true },
    );
  }),
);

const courseGroups = computed(() => {
  const groups = [];
  const indexByCourseId = new Map();

  for (const section of sortedSections.value) {
    const courseId = Number(section.courseId);
    let group = indexByCourseId.get(courseId);

    if (!group) {
      group = {
        courseId,
        course: section.course,
        sections: [],
      };
      indexByCourseId.set(courseId, group);
      groups.push(group);
    }

    group.sections.push(section);
  }

  return groups;
});

const isEnrolled = (sectionId) => enrolledSectionIds.value.has(sectionId);

const enrollDisabled = (section) =>
  isEnrolled(section.id) || section.remainingSeats === 0;

const loadSemesters = async () => {
  loadingCatalog.value = true;
  error.value = "";

  try {
    const { data } = await catalogServices.listSemesters();
    semesters.value = data;
  } catch (err) {
    error.value = err.response?.data?.message || "Could not load semesters.";
  } finally {
    loadingCatalog.value = false;
  }
};

const refreshLists = async () => {
  if (!selectedSemesterId.value) {
    sections.value = [];
    enrollments.value = [];
    return;
  }

  loadingTable.value = true;
  error.value = "";

  try {
    const [sectionRes, enrollmentRes] = await Promise.all([
      catalogServices.listSections(selectedSemesterId.value),
      enrollmentServices.listEnrollments(selectedSemesterId.value),
    ]);
    sections.value = sectionRes.data;
    enrollments.value = enrollmentRes.data;
  } catch (err) {
    error.value = err.response?.data?.message || "Could not load sections.";
  } finally {
    loadingTable.value = false;
  }
};

watch(selectedSemesterId, refreshLists);
onMounted(loadSemesters);

const enrollIn = async (section) => {
  enrollingId.value = section.id;
  error.value = "";

  try {
    await enrollmentServices.enroll(section.id);
    await refreshLists();
  } catch (err) {
    error.value = err.response?.data?.message || "Could not enroll.";
    await refreshLists();
  } finally {
    enrollingId.value = null;
  }
};

const confirmDrop = async () => {
  dropping.value = true;
  error.value = "";

  try {
    await enrollmentServices.drop(dropTarget.value.id);
    dropTarget.value = null;
    await refreshLists();
  } catch (err) {
    error.value = err.response?.data?.message || "Could not drop the section.";
  } finally {
    dropping.value = false;
  }
};
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-6">Enrollment</h1>

    <v-alert v-if="error" type="error" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-select
      v-model="selectedSemesterId"
      label="Semester"
      :items="semesters"
      item-title="name"
      item-value="id"
      :loading="loadingCatalog"
      class="mb-6"
      clearable
      max-width="420"
    />

    <p v-if="!semesters.length && !loadingCatalog" class="text-body-1 mb-6">
      No semesters are open for registration yet.
    </p>
    <p v-else-if="!selectedSemesterId" class="text-body-1 mb-6">
      Select a semester to see available sections.
    </p>

    <v-row v-if="selectedSemesterId">
      <v-col cols="12" md="7">
        <h2 class="text-h6 mb-3">Available sections</h2>

        <v-progress-linear
          v-if="loadingTable"
          indeterminate
          class="mb-4"
        />

        <p
          v-else-if="!courseGroups.length"
          class="text-body-1"
        >
          No sections are offered in this semester.
        </p>

        <div
          v-else
          class="enroll-course-list"
        >
          <section
            v-for="group in courseGroups"
            :key="group.courseId"
            class="enroll-course"
          >
            <header class="enroll-course__header">
              <div class="text-subtitle-1 font-weight-medium">
                {{ group.course?.code }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ group.course?.title }}
                · {{ group.sections.length }}
                section{{ group.sections.length === 1 ? "" : "s" }}
              </div>
            </header>

            <v-table
              class="enroll-course__table"
              density="comfortable"
            >
              <thead>
                <tr>
                  <th class="text-left">Section</th>
                  <th class="text-left">Seats</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="section in group.sections"
                  :key="section.id"
                >
                  <td class="font-weight-medium">
                    {{ section.sectionNumber }}
                  </td>
                  <td>
                    <v-chip
                      v-if="section.remainingSeats === 0"
                      color="secondary"
                    >
                      Full
                    </v-chip>
                    <span v-else>
                      {{ section.remainingSeats }} / {{ section.capacity }}
                    </span>
                  </td>
                  <td>
                    <v-btn
                      color="primary"
                      variant="elevated"
                      class="oc-cta"
                      :class="{ 'enroll-btn--disabled': enrollDisabled(section) }"
                      :disabled="enrollDisabled(section)"
                      :loading="enrollingId === section.id"
                      @click="enrollIn(section)"
                    >
                      {{ isEnrolled(section.id) ? "Enrolled" : "Enroll" }}
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </section>
        </div>
      </v-col>

      <v-col cols="12" md="5">
        <h2 class="text-h6 mb-3">My Schedule</h2>

        <p v-if="!enrollments.length" class="text-body-1">
          You are not enrolled in any sections for this semester.
        </p>

        <div v-else class="enroll-schedule">
          <article
            v-for="row in enrollments"
            :key="row.id"
            class="enroll-schedule__row"
          >
            <div class="enroll-schedule__copy">
              <div class="text-subtitle-1 font-weight-medium">
                {{ row.section?.course?.code }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ row.section?.course?.title }}
              </div>
              <div class="text-body-2 mt-1">
                Section {{ row.section?.sectionNumber }}
              </div>
            </div>
            <v-btn
              icon="mdi-minus-circle-outline"
              variant="text"
              aria-label="Drop section"
              @click="dropTarget = row"
            />
          </article>
        </div>
      </v-col>
    </v-row>

    <v-dialog
      :model-value="!!dropTarget"
      max-width="420"
      @update:model-value="dropTarget = $event ? dropTarget : null"
    >
      <v-card>
        <v-card-item>
          <v-card-title>Drop section?</v-card-title>
        </v-card-item>
        <v-card-text>
          Drop {{ dropTarget?.section?.course?.code }}
          {{ dropTarget?.section?.course?.title }}
          (section {{ dropTarget?.section?.sectionNumber }})?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="dropTarget = null">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="dropping"
            @click="confirmDrop"
          >
            Drop
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.enroll-course-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.enroll-course__header {
  margin-bottom: 0.35rem;
  padding-bottom: 0.35rem;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.enroll-course__table {
  background: transparent;
}

.enroll-schedule {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.enroll-schedule__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.enroll-schedule__row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.enroll-schedule__copy {
  min-width: 0;
}

.enroll-btn--disabled {
  opacity: 0.45;
  filter: blur(0.4px);
}
</style>
