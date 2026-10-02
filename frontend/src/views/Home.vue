<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();

const user = ref(Utils.getStore("user"));
const loading = ref(false);

const signOut = async () => {
  loading.value = true;

  try {
    await authServices.logoutUser();
  } catch {
    // Session is already gone server-side; clear the client either way.
  } finally {
    Utils.removeItem("user");
    loading.value = false;
    router.push({ name: "login" });
  }
};
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-2">Welcome, {{ user?.fName }}</h1>

    <v-chip color="primary" variant="tonal" class="mb-6">
      {{ user?.role }}
    </v-chip>

    <p class="text-body-1 mb-6">
      Semesters, courses, sections, and enrollment arrive in later features.
    </p>

    <v-btn
      color="primary"
      variant="elevated"
      class="oc-cta"
      :loading="loading"
      @click="signOut"
    >
      Sign out
    </v-btn>
  </v-container>
</template>
