import type { PublicPlan } from '@/Components/patterns/PlanCard';

export function isFreePlan(plan: Pick<PublicPlan, 'price_minor' | 'slug'>): boolean {
    return plan.price_minor <= 0 || plan.slug === 'free-trial';
}

export function planRequiresApproval(plan: Pick<PublicPlan, 'price_minor' | 'slug'>): boolean {
    return !isFreePlan(plan);
}
