import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/AuthProvider';
import Button from '@/components/Button';
import { Input } from '@/components/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithOAuth, resetPassword, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      router.replace('/(tabs)/dashboard');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your dashboard</Text>
        </View>

        <View style={styles.formContainer}>
          <form onSubmit={handleSubmit(onSubmit)}>
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

            <View style={styles.rememberRow}>
              <Text style={styles.rememberText}>Remember me</Text>
              <TouchableOpacity onPress={() => {
                const email = prompt('Enter your email to reset password:');
                if (email) {
                  resetPassword(email).then(({ error }) => {
                    if (error) {
                      Alert.alert('Error', error.message);
                    } else {
                      Alert.alert('Success', 'Password reset email sent!');
                    }
                  });
                }
              }}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <Button
              style={styles.submitButton}
              disabled={isLoading || authLoading}
              loading={isLoading || authLoading}
            >
              {isLoading || authLoading ? 'Signing in...' : 'Sign In'}
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
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>Sign up</Text>
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
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberText: {
    fontSize: 14,
    color: '#6b7280',
  },
  forgotText: {
    fontSize: 14,
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
  linkText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
});