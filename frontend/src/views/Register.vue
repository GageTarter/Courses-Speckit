<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();

const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !!value || "Password is required.",
  (value) => value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

const createAccount = async () => {
  error.value = "";

  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const response = await authServices.registerUser({
      fName: fName.value,
      lName: lName.value,
      email: email.value,
      username: username.value,
      password: password.value,
    });

    Utils.setStore("user", response.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    router.push({ name: "home" });
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      "Could not create the account. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="6">
        <v-card class="pa-6">
          <h1 class="text-h5 mb-6">Create account</h1>

          <v-alert v-if="error" type="error" class="mb-4">
            {{ error }}
          </v-alert>

          <v-form ref="form" @submit.prevent="createAccount">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="fName"
                  label="First name"
                  :rules="fNameRules"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="lName"
                  label="Last name"
                  :rules="lNameRules"
                />
              </v-col>
            </v-row>

            <v-text-field v-model="email" label="Email" :rules="emailRules" />

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
              autocomplete="new-password"
            />

            <v-text-field
              v-model="confirmPassword"
              label="Confirm password"
              type="password"
              :rules="confirmPasswordRules"
              autocomplete="new-password"
            />

            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta mt-4"
              :loading="loading"
              block
            >
              Create account
            </v-btn>
          </v-form>

          <div class="mt-6 text-center">
            <v-btn :to="{ name: 'login' }" color="secondary" variant="text">
              Already have an account?
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
