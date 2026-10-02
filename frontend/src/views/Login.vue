<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();

const form = ref(null);
const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value || "Password is required."];

const signIn = async () => {
  error.value = "";

  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const response = await authServices.loginUser({
      username: username.value,
      password: password.value,
    });

    Utils.setStore("user", response.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    router.push({ name: "home" });
  } catch (err) {
    error.value =
      err.response?.data?.message || "Could not sign in. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="5">
        <v-card class="pa-6">
          <h1 class="text-h5 mb-6">Sign in</h1>

          <v-alert v-if="error" type="error" class="mb-4">
            {{ error }}
          </v-alert>

          <v-form ref="form" @submit.prevent="signIn">
            <v-text-field
              v-model="username"
              label="Username"
              :rules="usernameRules"
              autocomplete="username"
            />

            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              :rules="passwordRules"
              autocomplete="current-password"
            />

            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta mt-4"
              :loading="loading"
              block
            >
              Sign in
            </v-btn>
          </v-form>

          <div class="mt-6 text-center">
            <v-btn :to="{ name: 'register' }" color="secondary" variant="text">
              Create an account
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
