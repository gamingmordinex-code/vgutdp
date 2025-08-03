import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { GraduationCap, Send, Check, RotateCcw, UserPlus, LogIn, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// InputOTP removed - using simple Input for better compatibility
import { useToast } from "@/hooks/use-toast";
import { sendOtp, verifyOtp } from "@/lib/auth";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type LoginForm = z.infer<typeof loginSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function Login() {
  const [step, setStep] = useState<"selection" | "login" | "otp">("selection");
  const [userType, setUserType] = useState<"new" | "existing" | null>(null);
  const [credentials, setCredentials] = useState<LoginForm | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      phone: "",
    },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onChange"
  });

  const sendOtpMutation = useMutation({
    mutationFn: sendOtp,
    onSuccess: () => {
      setStep("otp");
      // Clear OTP form completely
      otpForm.reset();
      otpForm.setValue("otp", "");
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      
      // Redirect based on role
      if (data.user.role === "admin") {
        setLocation("/admin");
      } else if (data.user.role === "student") {
        setLocation("/student");
      } else if (data.user.role === "faculty") {
        setLocation("/faculty");
      } else {
        setLocation("/");
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSendOtp = (data: LoginForm) => {
    setCredentials(data);
    setOtpValue(""); // Clear OTP value
    sendOtpMutation.mutate(data);
  };

  const onVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials || !otpValue || otpValue.length !== 6) return;
    
    verifyOtpMutation.mutate({
      ...credentials,
      otp: otpValue,
    });
  };

  const onResendOtp = () => {
    if (!credentials) return;
    sendOtpMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">AcademiX</h1>
              <p className="text-sm text-gray-500">Academic Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-lg mx-auto shadow-xl border-0">
          <CardHeader className="space-y-1 bg-gradient-to-r from-primary to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-white">
              Welcome to AcademiX
            </CardTitle>
            <CardDescription className="text-center text-purple-100">
              {step === "selection" 
                ? "Choose your account type to continue"
                : step === "login" 
                ? "Enter your credentials to access the system"
                : "Enter the verification code sent to your phone"
              }
            </CardDescription>
          </CardHeader>
        
        <CardContent className="space-y-6 p-6 sm:p-8">
          {step === "selection" ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Choose Account Type</h3>
                <p className="text-sm text-gray-600">
                  Select how you want to access AcademiX
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-20 sm:h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  onClick={() => {
                    setUserType("new");
                    setLocation("/registration");
                  }}
                >
                  <UserPlus className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-base">New User</span>
                  <span className="text-xs text-gray-500 text-center">Register as Student/Faculty</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="h-20 sm:h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  onClick={() => {
                    setUserType("existing");
                    setStep("login");
                  }}
                >
                  <LogIn className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-base">Existing User</span>
                  <span className="text-xs text-gray-500 text-center">Admin, Faculty, Student</span>
                </Button>
              </div>
            </div>
          ) : step === "login" ? (
            <div className="space-y-6">
              {userType === "existing" && (
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("selection")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
              )}
              
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onSendOtp)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="student@university.edu"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+91 9876543210"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>
            </Form>
            </div>
          ) : (
            <form onSubmit={onVerifyOtp} className="space-y-6">
              <div>
                <Label htmlFor="otp-input">Enter 6-Digit OTP</Label>
                <Input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6 digits"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                  className="text-center text-xl tracking-widest font-mono border-2 border-primary/20 focus:border-primary mt-2"
                  value={otpValue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpValue(value);
                  }}
                />
                <div className="text-sm text-gray-500 text-center bg-gray-50 p-2 rounded mt-2">
                  Fixed OTP: <span className="font-mono font-bold text-primary">263457</span> (for all users)
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyOtpMutation.isPending || otpValue.length !== 6}
                >
                  {verifyOtpMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Verify & Login
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onResendOtp}
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Resend OTP
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2024 AcademiX. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-primary">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-primary">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
