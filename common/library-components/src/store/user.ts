export interface UserInfo {
    id?: string;
    name?: string;
    email?: string;

    accountEnabled: boolean;
    onPaidPlan: boolean;

    showSignup?: boolean;
}
