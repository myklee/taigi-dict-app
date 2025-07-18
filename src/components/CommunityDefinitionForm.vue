<template>
  <div class="community-definition-form">
    <div class="form-header">
      <h2>Add Community Definition</h2>
      <p class="form-description">
        Share your knowledge by contributing a definition for this word. Your submission will be reviewed by the community.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="definition-form">
      <!-- Definition Field -->
      <div class="form-group">
        <label for="definition" class="form-label">
          Definition <span class="required">*</span>
        </label>
        <textarea
          id="definition"
          v-model="form.definition"
          class="form-textarea"
          :class="{ 'error': errors.definition }"
          placeholder="Enter your definition here..."
          rows="4"
          maxlength="2000"
          :disabled="loading"
          @input="validateField('definition')"
          @blur="validateField('definition')"
        ></textarea>
        <div class="field-info">
          <span class="char-count">{{ form.definition.length }}/2000</span>
          <div v-if="errors.definition" class="error-message">
            {{ errors.definition }}
          </div>
        </div>
      </div>

      <!-- Usage Example Field -->
      <div class="form-group">
        <label for="usageExample" class="form-label">
          Usage Example
        </label>
        <textarea
          id="usageExample"
          v-model="form.usageExample"
          class="form-textarea"
          :class="{ 'error': errors.usageExample }"
          placeholder="Provide an example of how this word is used..."
          rows="3"
          maxlength="1000"
          :disabled="loading"
          @input="validateField('usageExample')"
          @blur="validateField('usageExample')"
        ></textarea>
        <div class="field-info">
          <span class="char-count">{{ form.usageExample.length }}/1000</span>
          <div v-if="errors.usageExample" class="error-message">
            {{ errors.usageExample }}
          </div>
        </div>
      </div>

      <!-- Tags Field -->
      <div class="form-group">
        <label for="tags" class="form-label">
          Tags
        </label>
        <div class="tags-input-container">
          <input
            id="tags"
            v-model="tagInput"
            type="text"
            class="form-input"
            :class="{ 'error': errors.tags }"
            placeholder="Add tags (press Enter to add)"
            maxlength="50"
            :disabled="loading || form.tags.length >= 10"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            @input="validateField('tags')"
          />
          <button
            type="button"
            class="add-tag-btn"
            :disabled="!tagInput.trim() || form.tags.length >= 10 || loading"
            @click="addTag"
          >
            Add
          </button>
        </div>
        <div class="tags-display">
          <span
            v-for="(tag, index) in form.tags"
            :key="index"
            class="tag"
          >
            {{ tag }}
            <button
              type="button"
              class="remove-tag"
              :disabled="loading"
              @click="removeTag(index)"
            >
              ×
            </button>
          </span>
        </div>
        <div class="field-info">
          <span class="tag-count">{{ form.tags.length }}/10 tags</span>
          <div v-if="errors.tags" class="error-message">
            {{ errors.tags }}
          </div>
        </div>
      </div>

      <!-- Context Field -->
      <div class="form-group">
        <label for="context" class="form-label">
          Context
        </label>
        <textarea
          id="context"
          v-model="form.context"
          class="form-textarea"
          :class="{ 'error': errors.context }"
          placeholder="Provide additional context (e.g., regional usage, formality level, etc.)"
          rows="2"
          maxlength="500"
          :disabled="loading"
          @input="validateField('context')"
          @blur="validateField('context')"
        ></textarea>
        <div class="field-info">
          <span class="char-count">{{ form.context.length }}/500</span>
          <div v-if="errors.context" class="error-message">
            {{ errors.context }}
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="button"
          class="btn-secondary"
          :disabled="loading"
          @click="saveDraft"
        >
          <span v-if="savingDraft">Saving...</span>
          <span v-else>Save Draft</span>
        </button>
        
        <button
          type="submit"
          class="btn-primary"
          :disabled="!isFormValid || loading"
        >
          <span v-if="loading">Submitting...</span>
          <span v-else>Submit Definition</span>
        </button>
      </div>

      <!-- General Error Message -->
      <div v-if="generalError" class="general-error">
        {{ generalError }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useCommunityStore } from '@/stores/communityStore';
import { useAuthStore } from '@/stores/authStore';
import { validateCreateDefinition, CommunityValidationError } from '@/utils/communityValidation';

// Props
const props = defineProps({
  wordId: {
    type: String,
    required: true
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
});

// Emits
const emit = defineEmits(['success', 'cancel', 'draft-saved']);

// Stores
const communityStore = useCommunityStore();
const authStore = useAuthStore();

// Form state
const form = ref({
  definition: '',
  usageExample: '',
  tags: [],
  context: ''
});

// UI state
const tagInput = ref('');
const loading = ref(false);
const savingDraft = ref(false);
const errors = ref({});
const generalError = ref('');
const successMessage = ref('');

// Computed properties
const isFormValid = computed(() => {
  return form.value.definition.trim().length >= 5 && 
         Object.keys(errors.value).length === 0;
});

// Validation functions
const validateField = (fieldName) => {
  const fieldErrors = {};
  
  switch (fieldName) {
    case 'definition':
      const def = form.value.definition.trim();
      if (!def) {
        fieldErrors.definition = 'Definition is required';
      } else if (def.length < 5) {
        fieldErrors.definition = 'Definition must be at least 5 characters long';
      } else if (def.length > 2000) {
        fieldErrors.definition = 'Definition is too long (max 2000 characters)';
      }
      break;
      
    case 'usageExample':
      if (form.value.usageExample.length > 1000) {
        fieldErrors.usageExample = 'Usage example is too long (max 1000 characters)';
      }
      break;
      
    case 'tags':
      if (form.value.tags.length > 10) {
        fieldErrors.tags = 'Too many tags (max 10)';
      }
      break;
      
    case 'context':
      if (form.value.context.length > 500) {
        fieldErrors.context = 'Context is too long (max 500 characters)';
      }
      break;
  }
  
  // Update errors
  if (fieldErrors[fieldName]) {
    errors.value[fieldName] = fieldErrors[fieldName];
  } else {
    delete errors.value[fieldName];
  }
};

const validateForm = () => {
  validateField('definition');
  validateField('usageExample');
  validateField('tags');
  validateField('context');
  
  return Object.keys(errors.value).length === 0;
};

// Tag management
const addTag = () => {
  const tag = tagInput.value.trim().toLowerCase();
  
  if (!tag) return;
  
  if (form.value.tags.length >= 10) {
    errors.value.tags = 'Maximum 10 tags allowed';
    return;
  }
  
  if (tag.length > 50) {
    errors.value.tags = 'Tag is too long (max 50 characters)';
    return;
  }
  
  if (form.value.tags.includes(tag)) {
    errors.value.tags = 'Tag already exists';
    return;
  }
  
  form.value.tags.push(tag);
  tagInput.value = '';
  delete errors.value.tags;
};

const removeTag = (index) => {
  form.value.tags.splice(index, 1);
  delete errors.value.tags;
};

// Form submission
const handleSubmit = async () => {
  if (!authStore.user) {
    generalError.value = 'You must be logged in to submit definitions';
    return;
  }
  
  if (!validateForm()) {
    generalError.value = 'Please fix the errors above';
    return;
  }
  
  loading.value = true;
  generalError.value = '';
  successMessage.value = '';
  
  try {
    const submissionData = {
      wordId: props.wordId,
      definition: form.value.definition.trim(),
      usageExample: form.value.usageExample.trim() || undefined,
      tags: form.value.tags,
      context: form.value.context.trim() || undefined
    };
    
    // Validate with Zod schema
    validateCreateDefinition(submissionData);
    
    const result = await communityStore.submitDefinition(submissionData);
    
    if (result.success) {
      successMessage.value = 'Definition submitted successfully! It will be reviewed by the community.';
      
      // Clear draft from localStorage
      clearDraft();
      
      // Emit success event
      emit('success', result.data);
      
      // Reset form after a delay
      setTimeout(() => {
        resetForm();
      }, 2000);
    } else {
      generalError.value = result.error?.message || 'Failed to submit definition';
    }
  } catch (error) {
    if (error instanceof CommunityValidationError) {
      if (error.field) {
        errors.value[error.field] = error.message;
      } else {
        generalError.value = error.message;
      }
    } else {
      generalError.value = 'An unexpected error occurred. Please try again.';
      console.error('Form submission error:', error);
    }
  } finally {
    loading.value = false;
  }
};

// Draft management
const getDraftKey = () => `community-definition-draft-${props.wordId}`;

const saveDraft = async () => {
  savingDraft.value = true;
  
  try {
    const draftData = {
      ...form.value,
      timestamp: Date.now()
    };
    
    localStorage.setItem(getDraftKey(), JSON.stringify(draftData));
    
    // Show brief success message
    const originalSuccess = successMessage.value;
    successMessage.value = 'Draft saved locally';
    
    setTimeout(() => {
      if (successMessage.value === 'Draft saved locally') {
        successMessage.value = originalSuccess;
      }
    }, 2000);
    
    emit('draft-saved', draftData);
  } catch (error) {
    console.error('Failed to save draft:', error);
  } finally {
    savingDraft.value = false;
  }
};

const loadDraft = () => {
  try {
    const draftData = localStorage.getItem(getDraftKey());
    if (draftData) {
      const parsed = JSON.parse(draftData);
      
      // Only load if draft is less than 24 hours old
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        form.value.definition = parsed.definition || '';
        form.value.usageExample = parsed.usageExample || '';
        form.value.tags = parsed.tags || [];
        form.value.context = parsed.context || '';
      } else {
        // Clear old draft
        clearDraft();
      }
    }
  } catch (error) {
    console.error('Failed to load draft:', error);
  }
};

const clearDraft = () => {
  localStorage.removeItem(getDraftKey());
};

const resetForm = () => {
  form.value = {
    definition: '',
    usageExample: '',
    tags: [],
    context: ''
  };
  tagInput.value = '';
  errors.value = {};
  generalError.value = '';
  successMessage.value = '';
};

// Auto-save draft on form changes (debounced)
let draftTimeout;
watch(
  () => form.value,
  () => {
    if (draftTimeout) clearTimeout(draftTimeout);
    draftTimeout = setTimeout(() => {
      if (form.value.definition.trim() || form.value.usageExample.trim() || 
          form.value.tags.length > 0 || form.value.context.trim()) {
        saveDraft();
      }
    }, 2000);
  },
  { deep: true }
);

// Lifecycle
onMounted(() => {
  // Load initial data if provided
  if (props.initialData) {
    Object.assign(form.value, props.initialData);
  } else {
    // Try to load draft
    loadDraft();
  }
});
</script>

<style scoped>
.community-definition-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 1.5rem;
  background: var(--raisinBlack);
  border-radius: 8px;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--white);
}

.form-description {
  margin: 0;
  color: var(--frenchGray);
  font-size: 0.9rem;
  line-height: 1.4;
}

.definition-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--white);
  font-size: 0.9rem;
}

.required {
  color: #ef4444;
}

.form-textarea,
.form-input {
  background-color: var(--gunmetal);
  color: var(--white);
  border: 1px solid var(--slateGray);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s, background-color 0.2s;
}

.form-textarea {
  min-height: 80px;
}

.form-textarea:focus,
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: var(--gunmetal);
}

.form-textarea::placeholder,
.form-input::placeholder {
  color: var(--slateGray);
}

.form-textarea.error,
.form-input.error {
  border-color: #ef4444;
}

.form-textarea:disabled,
.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.char-count,
.tag-count {
  font-size: 0.8rem;
  color: var(--slateGray);
  white-space: nowrap;
}

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  flex: 1;
}

.tags-input-container {
  display: flex;
  gap: 0.5rem;
}

.tags-input-container .form-input {
  flex: 1;
}

.add-tag-btn {
  background-color: var(--gunmetal);
  color: var(--white);
  border: 1px solid var(--slateGray);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.add-tag-btn:hover:not(:disabled) {
  background-color: var(--slateGray);
}

.add-tag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background-color: var(--gunmetal);
  color: var(--white);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  border: 1px solid var(--slateGray);
}

.remove-tag {
  background: none;
  border: none;
  color: var(--frenchGray);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

.remove-tag:hover:not(:disabled) {
  color: #ef4444;
}

.remove-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: var(--slateGray);
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--gunmetal);
  color: var(--white);
  border: 1px solid var(--slateGray);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--slateGray);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.general-error {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.success-message {
  background-color: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 1rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .community-definition-form {
    padding: 1rem;
    margin: 0;
    border-radius: 0;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
  }
  
  .tags-input-container {
    flex-direction: column;
  }
  
  .add-tag-btn {
    align-self: flex-start;
  }
  
  .field-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-textarea,
  .form-input {
    font-size: 1.1rem;
    padding: 1rem;
  }
}

/* Touch-friendly interactions */
@media (hover: none) and (pointer: coarse) {
  .btn-primary,
  .btn-secondary,
  .add-tag-btn {
    min-height: 44px;
  }
  
  .remove-tag {
    min-width: 24px;
    min-height: 24px;
  }
  
  .form-textarea,
  .form-input {
    min-height: 44px;
  }
}
</style>