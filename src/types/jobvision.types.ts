export interface JobVisionListResponse {
    traceId: string | null;
    isSuccess: boolean;
    statusCode: number;
    message: string;
    data: JobVisionJobList;
}

export interface JobVisionJobList {
    currentPage: number;
    pageSize: number;
    jobPosts: JobVisionJob[];
    filters: JobVisionFilters;
    searchId: string;
    jobPostCount: number;
    hasSalaryHistogram: boolean;
}

export interface JobVisionJob {
    score: number;
    itemIndex: number;
    searchPositionCoefficient: number;
    labelDetails: JobVisionLabelDetail[];

    id: number;
    title: string;
    isPersian: boolean;

    userJobPostInfo: JobVisionUserJobPostInfo;
    properties: JobVisionJobProperties;

    company: JobVisionListCompany;
    location: JobVisionLocation;

    jobCategories: JobVisionCategory[];
    benefits: JobVisionBenefit[];

    workType: JobVisionLookup;
    seniorityLevel: JobVisionLookup;

    salary: JobVisionSalary | null;
    industry: JobVisionIndustry;
    gender: JobVisionLookup;

    labels: string[];

    firstActivationTime: JobVisionDateInfo;
    activationTime: JobVisionDateInfo;
    expireTime: JobVisionDateInfo;
}
export interface JobVisionUserJobPostInfo {
    matchingScore: number;
    isSuitableForCandidate: boolean;
    isBookmarked: boolean;
    isApplied: boolean;
    isCanceledApply: boolean;
    isAppliedAsVip: boolean;
    hasHighChanceBadge: boolean;
}

export interface JobVisionJobProperties {
    isInternship: boolean;
    isRemote: boolean;
    isUrgent: boolean;
    requiredRelatedExperienceYears: number | null;
    suitableForDisabled: boolean;
    salaryCanBeShown: boolean;
    isCheckingResumes: boolean;
    typeId: number;
    linkOutAddress: string | null;
    isBlueCollarJob: boolean;
}

export interface JobVisionListCompany {
    id: number;
    nameFa: string;
    nameEn: string;
    hasPicture: boolean;
    logoFileId: number;
    logoUrl: string;
    pageUrl: string;

    isEmployerResponsive: boolean;
    isFamous: boolean;
    isGovernmentalCompany: boolean;

    companyScore: number;
}

export interface JobVisionLocation {
    country: JobVisionLocationItem;
    province: JobVisionProvince;
    city: JobVisionCity;
    regionGroup: JobVisionRegion;
    region: JobVisionRegion;
}

export interface JobVisionLocationItem {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionProvince {
    urlTitle: string;
    id: number;
    title: string;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionCity {
    citySize: number;
    citySizeGroupId: number;
    province: JobVisionProvince | null;
    urlTitle: string;
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionRegion {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionCategory {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionBenefit {
    id: number;
    title: string;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionLookup {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionSalary {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
    min: number;
    max: number;
}

export interface JobVisionIndustry {
    id: number;
    title: string;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionDateInfo {
    beautifyFa: string;
    beautifyEn: string;
    date: string;
}

export interface JobVisionLabelDetail {
    title: string;
    type: number;
}

export interface JobVisionFilters {
    keyword: string;
    jobCategory: unknown | null;
    locationWrapper: unknown | null;
    workExperiences: unknown | null;
    salaries: unknown | null;
    workTypes: unknown | null;
    seniorityLevels: unknown | null;
    jobPostPublishTime: unknown | null;
    industries: unknown | null;
    company: unknown | null;
    benefits: unknown | null;
    remote: boolean;
}

export interface JobVisionDetailResponse {
    traceId: string | null;
    isSuccess: boolean;
    statusCode: number;
    message: string;
    data: JobVisionJobDetails;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export interface JobVisionJobDetails {
    id: number;
    title: string;
    description: string;
    isPersian: boolean;
    insightApplicationCount: number;

    company: JobVisionCompanyDetails;
    location: JobVisionLocationDetails;

    userJobPostInfo: JobVisionDetailUserJobPostInfo;
    jobFairInfo: JobVisionJobFairInfo;

    jobCategories: JobVisionCategory[];

    workType: JobVisionLookup;
    seniorityLevel: JobVisionLookup;

    salary: JobVisionSalary | null;
    industry: JobVisionIndustry;
    gender: JobVisionLookup;

    benefits: JobVisionBenefit[];

    academicRequirements: unknown | null;

    softwareRequirements: JobVisionSoftwareRequirement[];

    languageRequirements: unknown | null;
    skills: unknown[];

    workDays: string;
    businessTrip: unknown | null;

    requiredRelatedExperienceYears: number | null;
    requiredAcademicHistory: unknown | null;
    requiredKnowledge: unknown | null;

    requiredAgeMin: number | null;
    requiredAgeMax: number | null;

    shouldDoneMilitaryService: boolean;

    isInternship: boolean;
    isRemote: boolean;
    suitableForDisabled: boolean;
    isUrgent: boolean;
    indexable: boolean;

    typeId: number;

    linkOutAddress: string | null;

    labels: string[];

    isBlueCollarJob: boolean;
    hasSalaryHistogram: boolean;

    firstActivationTime: JobVisionActivationTime;
    activationTime: JobVisionActivationTime;

    expireTime: JobVisionExpireTime;

    isExpired: boolean;
}

export interface JobVisionCompanyDetails {
    id: number;

    name: JobVisionLocalizedText;
    brand: JobVisionLocalizedText;

    description: JobVisionLocalizedText;
    productsOrServices: JobVisionLocalizedText;
    shortDescription: JobVisionLocalizedText;

    establishmentYear: number | null;

    hasPicture: boolean;
    hasCsrBadge: boolean;

    website: string | null;
    companyLink: string;

    logoUrl: string;
    headerImageLink: string;

    size: JobVisionCompanySize;

    ownershipType: unknown | null;
    companyType: unknown | null;

    benefits: JobVisionBenefit[];

    industries: JobVisionCompanyIndustry[];

    hasCompanyBranding: boolean;

    companyBrandingInfo: JobVisionCompanyBrandingInfo;

    hasAnyOtherActiveJobPosts: boolean;

    isGovernmentalCompany: boolean;

    companyScore: number | null;
}

export interface JobVisionLocalizedText {
    titleFa: string;
    titleEn: string;
}

export interface JobVisionCompanySize {
    id: number;
    title: string;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionCompanyIndustry {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}


export interface JobVisionCompanyBrandingInfo {
    hasBranding: boolean;
    hasStatistics: boolean;
    hasHireSteps: boolean;
    hasTeamMembers: boolean;
    hasSuccessStories: boolean;
    hasMedia: boolean;
}

export interface JobVisionLocationDetails {
    country: JobVisionLocationItem;
    province: JobVisionLocationItem;
    city: JobVisionDetailCity;
    regionGroup: JobVisionLocationItem;
    region: JobVisionLocationItem;
}

export interface JobVisionDetailCity {
    citySize: number;
    citySizeGroupId: number;

    province: JobVisionLocationItem;

    urlTitle: string;

    id: number;

    title: string | null;
    titleFa: string;
    titleEn: string;
}



export interface JobVisionDetailUserJobPostInfo {
    id: number;
    matchingScore: number;

    isBookmarked: boolean;
    isApplied: boolean;
    isCanceledApply: boolean;
    isAppliedAsVip: boolean;
    hasHighChanceBadge: boolean;
}

export interface JobVisionJobFairInfo {
    isApplicable: boolean;
    isJobFair: boolean;
}


export interface JobVisionSoftwareRequirement {
    software: JobVisionSoftware;
    skill: JobVisionSkill;
}

export interface JobVisionSoftware {
    id: number;
    title: string | null;
    titleFa: string;
    titleEn: string;
}

export interface JobVisionSkill {
    id: number;
    title: string;
    titleFa: string;
    titleEn: string;
}


export interface JobVisionActivationTime {
    passedDays: number;
    beautifyFa: string;
    beautifyEn: string;
    date: string;
}

export interface JobVisionExpireTime {
    date: string;
    daysLeftUntil: number;
}
