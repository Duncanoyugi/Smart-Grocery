import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VerifyOtpRequest } from '../../../core/models/auth-dtos';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  verifyForm: FormGroup;
  isLoading = false;
  email: string = '';
  userType: 'customer' | 'store_owner' = 'customer';
  countdown: number = 0;
  private countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.verifyForm = this.fb.group({
      otp1: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      otp2: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      otp3: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      otp4: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      otp5: ['', [Validators.required, Validators.pattern(/[0-9]/)]],
      otp6: ['', [Validators.required, Validators.pattern(/[0-9]/)]]
    });
  }

  ngOnInit(): void {
    // Get email and user type from query parameters
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.userType = params['userType'] || 'customer';
      
      if (!this.email) {
        console.warn('No email provided for OTP verification');
        // Redirect to register page if no email
        this.router.navigate(['/auth/register']);
        return;
      }

      // If user is store owner (ADMIN), they should login directly without OTP
      if (this.userType === 'store_owner') {
        this.redirectToLoginWithMessage();
        return;
      }
    });

    // Focus first input on load
    setTimeout(() => {
      this.focusInput(0);
    }, 100);

    // Start resend countdown
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onSubmit(): void {
    // Store owners (ADMIN) should not be verifying OTP
    if (this.userType === 'store_owner') {
      this.redirectToLoginWithMessage();
      return;
    }

    if (this.verifyForm.valid && this.email) {
      this.isLoading = true;
      
      const otp = this.getOtpValue();
      const verifyData: VerifyOtpRequest = {
        email: this.email,
        otp: otp
      };

      this.authService.verifyOtp(verifyData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            console.log('OTP verification successful', response);
            // Redirect to login page with success message
            this.router.navigate(['/auth/login'], { 
              queryParams: { 
                verified: 'true',
                message: 'Email verified successfully! You can now login.' 
              } 
            });
          } else {
            this.handleVerificationError({ error: { message: response.message } });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('OTP verification failed', error);
          this.handleVerificationError(error);
          // Clear form on error
          this.clearForm();
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private redirectToLoginWithMessage(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: {
        message: 'Store owner account created successfully! You can login directly.'
      }
    });
  }

  onInputChange(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    // Auto-tab to next input if current input has value
    if (value && index < 5) {
      this.focusInput(index + 1);
    }

    // Auto-submit if all inputs are filled
    if (this.isFormComplete()) {
      // Small delay to ensure all values are set
      setTimeout(() => {
        this.onSubmit();
      }, 100);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    // Handle backspace
    if (event.key === 'Backspace') {
      const currentInput = event.target as HTMLInputElement;
      
      if (!currentInput.value && index > 0) {
        // Move to previous input if current is empty
        this.focusInput(index - 1);
      }
    }

    // Handle paste
    if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      // Handle paste will be implemented in onPaste method
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    
    if (pastedData && /^\d{6}$/.test(pastedData)) {
      // Split the pasted OTP into individual digits
      const digits = pastedData.split('');
      
      digits.forEach((digit, index) => {
        if (index < 6) {
          const control = this.verifyForm.get(`otp${index + 1}`);
          control?.setValue(digit);
          control?.markAsTouched();
        }
      });

      // Focus the last input
      this.focusInput(5);
      
      // Auto-submit if form is complete
      if (this.isFormComplete()) {
        setTimeout(() => {
          this.onSubmit();
        }, 100);
      }
    }
  }

  resendOtp(): void {
    // Store owners don't need OTP resend
    if (this.userType === 'store_owner') {
      return;
    }

    if (this.countdown > 0 || !this.email) return;

    this.isLoading = true;
    
    // In a real app, you would call a resend OTP endpoint
    // For now, we'll simulate the behavior
    console.log('Resending OTP to:', this.email);
    
    setTimeout(() => {
      this.isLoading = false;
      this.startCountdown();
      alert('OTP has been resent to your email.');
    }, 1000);
  }

  private getOtpValue(): string {
    return Object.values(this.verifyForm.value).join('');
  }

  private focusInput(index: number): void {
    const inputId = `otp${index + 1}`;
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.focus();
    }
  }

  private isFormComplete(): boolean {
    return this.verifyForm.valid;
  }

  private clearForm(): void {
    this.verifyForm.reset();
    this.focusInput(0);
  }

  private startCountdown(): void {
    this.countdown = 30; // 30 seconds
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.verifyForm.controls).forEach(key => {
      this.verifyForm.get(key)?.markAsTouched();
    });
  }

  private handleVerificationError(error: any): void {
    let errorMessage = 'OTP verification failed. Please try again.';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      errorMessage = 'Invalid OTP. Please check the code and try again.';
    } else if (error.status === 410) {
      errorMessage = 'OTP has expired. Please request a new one.';
    }

    alert(errorMessage);
  }

  // Getters for form controls
  get otp1() { return this.verifyForm.get('otp1'); }
  get otp2() { return this.verifyForm.get('otp2'); }
  get otp3() { return this.verifyForm.get('otp3'); }
  get otp4() { return this.verifyForm.get('otp4'); }
  get otp5() { return this.verifyForm.get('otp5'); }
  get otp6() { return this.verifyForm.get('otp6'); }

  get canResend(): boolean {
    return this.countdown === 0 && !!this.email && this.userType === 'customer';
  }

  get isStoreOwner(): boolean {
    return this.userType === 'store_owner';
  }

  get formattedEmail(): string {
    if (!this.email) return '';
    const [username, domain] = this.email.split('@');
    return `${username.substring(0, 3)}***@${domain}`;
  }
}