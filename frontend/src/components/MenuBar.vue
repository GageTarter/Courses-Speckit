<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const loggingOut = ref(false);

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

const handleLogout = async () => {
  loggingOut.value = true;

  try {
    await authServices.logoutUser();
  } catch {
    // Clear local session even if the API call fails.
  } finally {
    Utils.removeItem("user");
    window.dispatchEvent(new CustomEvent("user-logged-out"));
    loggingOut.value = false;
    router.push({ name: "login" });
  }
};
</script>

<template>
  <v-app-bar
    v-if="user"
    color="primary"
    density="comfortable"
  >
    <v-app-bar-title>Course Management System</v-app-bar-title>

    <v-btn
      variant="text"
      color="white"
      to="/faculty"
      class="ml-4"
    >
      Faculty
    </v-btn>

    <v-spacer />

    <v-btn
      variant="text"
      color="white"
      :loading="loggingOut"
      @click="handleLogout"
    >
      Sign out
    </v-btn>
  </v-app-bar>
</template>
