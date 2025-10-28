import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.statusText) {
        errorMessage = error.statusText;
      }

      switch (error.status) {
        case 401:
          toastr.error('Please login again', 'Session Expired');
          router.navigate(['/auth/login']);
          break;
        case 403:
          toastr.error('You do not have permission to perform this action', 'Forbidden');
          break;
        case 404:
          toastr.error('Requested resource not found', 'Not Found');
          break;
        case 500:
          toastr.error('Server error occurred', 'Server Error');
          break;
        default:
          toastr.error(errorMessage, 'Error');
      }

      return throwError(() => error);
    })
  );
};