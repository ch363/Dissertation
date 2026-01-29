import { StyleSheet } from "react-native";
import { theme as baseTheme } from "@/services/theme/tokens";

export const profileScreenStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },

  // Header Gradient Styles
  headerGradient: {
    borderRadius: 24,
    padding: 24,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradientBorder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 4,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: baseTheme.typography.bold,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  levelBadgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#78350F',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 24,
    fontFamily: baseTheme.typography.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerStatText: {
    fontSize: 14,
    fontFamily: baseTheme.typography.medium,
    color: '#BFDBFE',
  },
  headerStatDot: {
    fontSize: 14,
    color: '#BFDBFE',
    opacity: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 10,
  },
  weeklyProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  weeklyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weeklyProgressTitle: {
    fontSize: 14,
    fontFamily: baseTheme.typography.medium,
    color: '#FFFFFF',
  },
  weeklyProgressXP: {
    fontSize: 18,
    fontFamily: baseTheme.typography.bold,
    color: '#FFFFFF',
  },
  weeklyProgressSubtext: {
    fontSize: 12,
    color: '#BFDBFE',
  },

  // Stats Cards Styles — high-end card treatment
  statsSection: {
    gap: 14,
  },
  statsRowPrimary: {
    flexDirection: 'row',
    gap: 14,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    minHeight: 136,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.9)',
    overflow: 'hidden',
  },
  statIconContainer: {
    borderRadius: 14,
    padding: 11,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconRed: {
    backgroundColor: '#FEF2F2',
  },
  statIconBlue: {
    backgroundColor: '#EFF6FF',
  },
  statIconOrange: {
    backgroundColor: '#FFF7ED',
  },
  statIconPurple: {
    backgroundColor: '#FAF5FF',
  },
  statValue: {
    fontSize: 32,
    fontFamily: baseTheme.typography.bold,
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: baseTheme.typography.semiBold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statUrgent: {
    fontSize: 11,
    fontFamily: baseTheme.typography.semiBold,
    color: '#DC2626',
    marginTop: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Progress Section Styles
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: baseTheme.typography.bold,
    color: '#0F172A',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: baseTheme.typography.semiBold,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyContainer: {
    borderRadius: 12,
    padding: 10,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  levelText: {
    fontSize: 18,
    fontFamily: baseTheme.typography.bold,
    color: '#0F172A',
  },
  levelRight: {
    alignItems: 'flex-end',
  },
  xpProgress: {
    fontSize: 14,
    fontFamily: baseTheme.typography.medium,
    color: '#64748B',
  },
  xpToNext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarGradient: {
    flex: 1,
    height: '100%',
  },
  milestone: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  progressStatIconBlue: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
  },
  progressStatIconRed: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 8,
  },
  progressStatIconGray: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  progressStatLabel: {
    fontSize: 12,
    fontFamily: baseTheme.typography.medium,
    color: '#64748B',
  },
  progressStatValue: {
    fontSize: 14,
    fontFamily: baseTheme.typography.bold,
    color: '#0F172A',
  },
  progressStatValueRed: {
    color: '#DC2626',
  },
  progressStatValueGray: {
    color: '#94A3B8',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },

  // Skill Mastery Styles
  skillSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillBadgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
  },
  skillsList: {
    gap: 12,
  },
  skillCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  skillCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  skillEmoji: {
    fontSize: 32,
  },
  skillCardInfo: {
    flex: 1,
  },
  skillCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillName: {
    fontSize: 16,
    fontFamily: baseTheme.typography.bold,
    color: '#0F172A',
  },
  skillLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  skillLevelText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#475569',
  },
  skillSubtext: {
    fontSize: 12,
    fontFamily: baseTheme.typography.medium,
    color: '#64748B',
  },
  skillProgressContainer: {
    position: 'relative',
  },
  skillProgressPercent: {
    position: 'absolute',
    top: -24,
    right: 0,
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#475569',
  },
  skillProgressBg: {
    height: 8,
    backgroundColor: '#CBD5E1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Settings — primary utility card (accessed from Profile)
  settingsSection: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 2,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontFamily: baseTheme.typography.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    opacity: 0.9,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingsRowIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  settingsRowContent: {
    flex: 1,
  },
  settingsRowLabel: {
    fontSize: 18,
    fontFamily: baseTheme.typography.bold,
    marginBottom: 2,
  },
  settingsRowSubtitle: {
    fontSize: 13,
    fontFamily: baseTheme.typography.regular,
  },

  // Activity Section Styles
  activitySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityBadgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: '#475569',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 16,
  },
  activityIcon: {
    borderRadius: 12,
    padding: 12,
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: baseTheme.typography.semiBold,
    color: '#0F172A',
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: baseTheme.typography.medium,
    color: '#64748B',
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  activityTimeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  activityXpBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activityXpText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseTheme.spacing.md,
    paddingVertical: baseTheme.spacing.md,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    padding: baseTheme.spacing.xs,
    minWidth: 60,
  },
  modalCancelText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
  modalTitle: {
    fontFamily: baseTheme.typography.bold,
    fontSize: 18,
  },
  modalSaveButton: {
    padding: baseTheme.spacing.xs,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  modalSaveText: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 16,
  },
  modalContent: {
    padding: baseTheme.spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: baseTheme.spacing.xl,
  },
  avatarEditContainer: {
    position: 'relative',
    marginBottom: baseTheme.spacing.md,
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  removeAvatarButton: {
    paddingVertical: baseTheme.spacing.sm,
  },
  removeAvatarText: {
    fontFamily: baseTheme.typography.regular,
    fontSize: 14,
  },
  inputSection: {
    marginBottom: baseTheme.spacing.lg,
  },
  inputLabel: {
    fontFamily: baseTheme.typography.semiBold,
    fontSize: 14,
    marginBottom: baseTheme.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: baseTheme.radius.md,
    padding: baseTheme.spacing.md,
    fontFamily: baseTheme.typography.regular,
    fontSize: 16,
  },
});
