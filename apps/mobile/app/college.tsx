import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';

const collegeItems = [
  { name: 'Dashboard', icon: 'analytics', route: '/college', color: '#0ea5e9', description: 'Overview of your term' },
  { name: 'Subjects', icon: 'book', route: '/college/subjects', color: '#8b5cf6', description: 'Manage subjects' },
  { name: 'Attendance', icon: 'checkmark-circle', route: '/college/attendance', color: '#22c55e', description: 'Track class attendance' },
  { name: 'Timetable', icon: 'calendar', route: '/college/timetable', color: '#f59e0b', description: 'Weekly class schedule' },
  { name: 'Assignments', icon: 'document-text', route: '/college/assignments', color: '#ef4444', description: 'Track assignments & exams' },
] as const;

export default function CollegeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>College</Text>
            <Text style={styles.subtitle}>Manage your academic life</Text>
          </View>
        </View>

        {/* College Items */}
        <View style={styles.list}>
          {collegeItems.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.listItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button style={styles.quickActionButton} onPress={() => router.push('/college/subjects/new' as any)}>
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>Add Subject</Text>
            </Button>
            <Button style={styles.quickActionButton} onPress={() => router.push('/college/attendance' as any)}>
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>Mark Attendance</Text>
            </Button>
            <Button style={styles.quickActionButton} onPress={() => router.push('/college/assignments/new' as any)}>
              <Ionicons name="document-text" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>New Assignment</Text>
            </Button>
            <Button style={styles.quickActionButton} onPress={() => router.push('/college/timetable' as any)}>
              <Ionicons name="calendar" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>View Timetable</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  list: {
    gap: 12,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  itemDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  quickActions: {
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    height: 56,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});