import { StyleSheet } from "react-native";
import { theme as baseTheme, Theme } from "@/services/theme/tokens";

export function createProfileScreenStyles(theme: Theme) {
  const c = theme.colors;
  return StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },

  // Header Gradient Styles (on primary gradient — keep light text/contrast)
  headerGradient: {
    borderRadius: 24,
    padding: 20,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  headerMenuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    padding: 10,
  },
  headerMenuButtonPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  weeklyProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  weeklyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weeklyProgressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyProgressTitle: {
    fontSize: 13,
    fontFamily: baseTheme.typography.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  weeklyProgressXP: {
    fontSize: 16,
    fontFamily: baseTheme.typography.bold,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  weeklyProgressSubtext: {
    fontSize: 11,
    color: 'rgba(191, 219, 254, 0.85)',
  },

  // Stats Cards Styles — theme-aware
  statsSection: {
    gap: 10,
  },
  statsRowPrimary: {
    flexDirection: 'row',
    gap: 10,
  },
  statCardSlot: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  statCardSlotInner: {
    flex: 1,
    minWidth: 0,
  },
  statCardTouchable: {
    flex: 1,
    minWidth: 0,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 20,
    padding: 14,
    minHeight: 108,
    shadowColor: c.border,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
  },
  statCardActionable: {
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1.5,
    borderColor: c.error + '40',
  },
  statCardWhite: {
    backgroundColor: c.card,
  },
  statCardPressed: {
    opacity: 0.9,
  },
  statCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardMain: {
    flex: 1,
  },
  statIconContainer: {
    borderRadius: 12,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconRed: {
    backgroundColor: c.error + '20',
  },
  statIconRedAction: {
    backgroundColor: c.error + '25',
  },
  statIconBlue: {
    backgroundColor: c.primary + '20',
  },
  statIconOrange: {
    backgroundColor: '#EA580C' + '20',
  },
  statIconPurple: {
    backgroundColor: '#9333EA' + '20',
  },
  statValue: {
    fontSize: 28,
    fontFamily: baseTheme.typography.bold,
    color: c.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: baseTheme.typography.semiBold,
    color: c.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statActionSublabel: {
    fontSize: 10,
    fontFamily: baseTheme.typography.medium,
    color: c.mutedText,
    marginTop: 2,
    letterSpacing: 0.2,
  },

  // Progress Section Styles
  progressSection: {
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: c.border,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: c.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: baseTheme.typography.bold,
    color: c.text,
  },
  viewAllButtonWrap: {
    flexShrink: 0,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  viewAllButtonPressed: {
    opacity: 0.7,
  },
  viewAllText: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: baseTheme.typography.semiBold,
    flexShrink: 0,
  },
  viewAllChevronWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 16,
    flexShrink: 0,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    color: c.text,
  },
  levelRight: {
    alignItems: 'flex-end',
  },
  xpProgress: {
    fontSize: 14,
    fontFamily: baseTheme.typography.medium,
    color: c.mutedText,
  },
  xpToNext: {
    fontSize: 12,
    color: c.mutedText,
  },
  progressBarContainer: {
    marginBottom: 14,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: c.border,
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
    backgroundColor: c.primary + '25',
    borderRadius: 8,
    padding: 8,
  },
  progressStatIconRed: {
    backgroundColor: c.error + '20',
    borderRadius: 8,
    padding: 8,
  },
  progressStatIconGray: {
    backgroundColor: c.border + '60',
    borderRadius: 8,
    padding: 8,
  },
  progressStatLabel: {
    fontSize: 12,
    fontFamily: baseTheme.typography.medium,
    color: c.mutedText,
  },
  progressStatValue: {
    fontSize: 14,
    fontFamily: baseTheme.typography.bold,
    color: c.text,
  },
  progressStatValueRed: {
    color: c.error,
  },
  progressStatValueGray: {
    color: c.mutedText,
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: c.border,
  },

  // Skill Mastery Styles
  skillSection: {
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: c.border,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: c.border,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  skillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: c.primary + '30',
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
  emptyStateContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: baseTheme.typography.medium,
    color: c.mutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  skillCard: {
    backgroundColor: c.border + '40',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  skillCardPressed: {
    opacity: 0.92,
    backgroundColor: c.border + '60',
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
    color: c.text,
  },
  skillLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: c.border,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  skillLevelText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: c.mutedText,
  },
  skillSubtext: {
    fontSize: 12,
    fontFamily: baseTheme.typography.medium,
    color: c.mutedText,
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
    color: c.mutedText,
  },
  skillProgressBg: {
    height: 8,
    backgroundColor: c.border,
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
    shadowColor: c.border,
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
    flexWrap: 'nowrap',
    position: 'relative',
    minHeight: 52,
  },
  settingsRowChevron: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  settingsRowPressed: {
    opacity: 0.92,
  },
  settingsRowIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: c.border,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  settingsRowContent: {
    flex: 1,
    marginRight: 32,
    minWidth: 0,
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
    backgroundColor: c.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: c.border,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: c.border,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityBadge: {
    backgroundColor: c.border + '60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityBadgeText: {
    fontSize: 12,
    fontFamily: baseTheme.typography.bold,
    color: c.mutedText,
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
  activityItemPressed: {
    opacity: 0.92,
    backgroundColor: c.border + '40',
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
    color: c.text,
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: baseTheme.typography.medium,
    color: c.mutedText,
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  activityTimeText: {
    fontSize: 12,
    color: c.mutedText,
  },
  activityXpBadge: {
    backgroundColor: c.primary + '25',
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
}
