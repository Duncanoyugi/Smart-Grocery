import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth-dtos';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  userType: 'customer' | 'store_owner' = 'customer';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      // Basic user info
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]],
      
      // Store information (only for store owners)
      storeName: [''],
      storeLocation: [''],
      
      // Terms acceptance
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    // Update store validators based on user type
    this.updateStoreValidators();
  }

  setUserType(type: 'customer' | 'store_owner'): void {
    this.userType = type;
    this.updateStoreValidators();
    
    // Clear store fields when switching to customer
    if (type === 'customer') {
      this.registerForm.patchValue({
        storeName: '',
        storeLocation: ''
      });
    }
  }

  private updateStoreValidators(): void {
    const storeNameControl = this.registerForm.get('storeName');
    const storeLocationControl = this.registerForm.get('storeLocation');

    if (this.userType === 'store_owner') {
      storeNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      storeLocationControl?.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      storeNameControl?.clearValidators();
      storeLocationControl?.clearValidators();
    }

    storeNameControl?.updateValueAndValidity();
    storeLocationControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      const formValue = this.registerForm.value;
      const registerData: RegisterRequest = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        role: this.userType === 'store_owner' ? 'ADMIN' : 'CUSTOMER',
        store: this.userType === 'store_owner' ? {
          name: formValue.storeName,
          location: formValue.storeLocation
        } : undefined
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registration response:', response);
          
          if (response.success) {
            if (this.userType === 'store_owner') {
              // Store owners (ADMIN) go directly to login
              this.router.navigate(['/auth/login'], { 
                queryParams: { 
                  message: 'Store owner account created successfully! You can login immediately.',
                  email: registerData.email
                } 
              });
            } else {
              // Customers go to OTP verification
              this.router.navigate(['/auth/verify-otp'], { 
                queryParams: { 
                  email: registerData.email,
                  userType: this.userType 
                } 
              });
            }
          } else {
            this.handleRegistrationError({ error: { message: response.message } });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration failed', error);
          this.handleRegistrationError(error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      if (confirmPassword?.errors?.['passwordMismatch']) {
        delete confirmPassword.errors['passwordMismatch'];
        confirmPassword.updateValueAndValidity();
      }
    }
    return null;
  }

  // Password validation methods for template
  hasLowercase(): boolean {
    const password = this.password?.value;
    return password && /[a-z]/.test(password);
  }

  hasUppercase(): boolean {
    const password = this.password?.value;
    return password && /[A-Z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.password?.value;
    return password && /\d/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.password?.value;
    return password && password.length >= 6;
  }

  // Getters for form controls
  get name() {
    return this.registerForm.get('name');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get storeName() {
    return this.registerForm.get('storeName');
  }

  get storeLocation() {
    return this.registerForm.get('storeLocation');
  }

  get acceptTerms() {
    return this.registerForm.get('acceptTerms');
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  private handleRegistrationError(error: any): void {
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 409) {
      errorMessage = 'An account with this email already exists.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid registration data. Please check your information.';
    }

    alert(errorMessage);
  }
}