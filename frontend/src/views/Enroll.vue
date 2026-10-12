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

const availableSections = computed(() =>
  sections.value.filter((row) => !enrolledSectionIds.value.has(row.id))
);

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
    <h1 class="text-h4 mb-6">Section Enrollment</h1>

    <v-alert v-if="error" type="error" class="mb-4">
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
    />

    <p v-if="!semesters.length && !loadingCatalog" class="text-body-1 mb-6">
      No semesters are open for registration yet.
    </p>
    <p v-else-if="!selectedSemesterId" class="text-body-1 mb-6">
      Select a semester to see available sections.
    </p>

    <v-row v-if="selectedSemesterId">
      <v-col cols="12" md="7">
        <v-data-table
          :headers="[
            { title: 'Course', key: 'course.code' },
            { title: 'Title', key: 'course.title' },
            { title: 'Section', key: 'sectionNumber' },
            { title: 'Seats', key: 'seats' },
            { title: 'Actions', key: 'actions', sortable: false },
          ]"
          :items="availableSections"
          :loading="loadingTable"
          item-value="id"
        >
          <template #item.seats="{ item }">
            <v-chip v-if="item.remainingSeats === 0" color="secondary">Full</v-chip>
            <span v-else>{{ item.remainingSeats }} / {{ item.capacity }}</span>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              :disabled="item.remainingSeats === 0"
              :loading="enrollingId === item.id"
              @click="enrollIn(item)"
            >
              Enroll
            </v-btn>
          </template>
          <template #no-data>
            No sections are offered in this semester.
          </template>
        </v-data-table>
      </v-col>

      <v-col cols="12" md="5">
        <v-card>
          <v-card-item>
            <v-card-title>My Schedule</v-card-title>
          </v-card-item>
          <v-card-text>
            <p v-if="!enrollments.length" class="text-body-1">
              You are not enrolled in any sections for this semester.
            </p>
            <v-list v-else>
              <v-list-item
                v-for="row in enrollments"
                :key="row.id"
                :title="`${row.section?.course?.code} ${row.section?.course?.title}`"
                :subtitle="`Section ${row.section?.sectionNumber}`"
              >
                <template #append>
                  <v-btn
                    icon="mdi-minus-circle-outline"
                    variant="text"
                    aria-label="Drop section"
                    @click="dropTarget = row"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog :model-value="!!dropTarget" max-width="420" @update:model-value="dropTarget = $event ? dropTarget : null">
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
