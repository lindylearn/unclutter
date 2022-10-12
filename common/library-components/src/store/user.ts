export interface UserInfo {
    id?: string;
    name?: string;
    email?: string;

    accountEnabled: boolean;
    topicsEnabled: boolean;

    showSignup?: boolean;
}
