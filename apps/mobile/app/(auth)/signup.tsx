import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@/components/Button';
import { Input } from '@/components/Input';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, signInWithOAuth, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password') ?? '';

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.fullName);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Success', 'Account created! Please check your email to verify.');
      router.push('/(auth)/login');
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Start organizing your life today — free forever</Text>
        </View>

        <View style={styles.formContainer}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
              disabled={isLoading || authLoading}
              style={styles.input}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
              disabled={isLoading || authLoading}
              style={styles.input}
            />

            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
                disabled={isLoading || authLoading}
                style={styles.input}
              />
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Button>
            </View>

            {password && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map(level => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            level <= passwordStrength
                              ? level <= 2
                                ? '#ef4444'
                                : level <= 3
                                ? '#f59e0b'
                                : level <= 4
                                ? '#eab308'
                                : '#22c55e'
                              : '#e5e7eb',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.strengthText}>
                  {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] || ''}
                </Text>
              </View>
            )}

            <Input
              label="Confirm Password"
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              disabled={isLoading || authLoading}
              style={styles.input}
            />

            <View style={styles.termsRow}>
              <Text style={styles.termsText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text>{' '}
                and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </View>

            <Button
              style={styles.submitButton}
              disabled={isLoading || authLoading}
              loading={isLoading || authLoading}
            >
              {isLoading || authLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.oauthButtons}>
            <Button variant="outline" style={styles.oauthButton} onPress={() => signInWithOAuth('google').then(({ error }: { error: any }) => {
              if (error) Alert.alert('Error', error.message);
            })}>
              <Text>Google</Text>
            </Button>
            <Button variant="outline" style={styles.oauthButton} onPress={() => signInWithOAuth('github').then(({ error }: { error: any }) => {
              if (error) Alert.alert('Error', error.message);
            })}>
              <Text>GitHub</Text>
            </Button>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  eyeButton: {
    marginLeft: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyeText: {
    fontSize: 14,
    color: '#0ea5e9',
  },
  passwordStrength: {
    marginBottom: 16,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    color: '#6b7280',
  },
  termsRow: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: '#0ea5e9',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 24,
    height: 52,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#9ca3af',
  },
  oauthButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  oauthButton: {
    flex: 1,
    height: 52,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  });