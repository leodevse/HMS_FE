export const HOTEL_STAY_POLICY = {
    CHECK_IN_HOUR: 14,
    CHECK_OUT_HOUR: 12,
};

export const withHotelTime = (date, type) => {
    const result = new Date(date);
    result.setHours(type === 'checkIn' ? HOTEL_STAY_POLICY.CHECK_IN_HOUR : HOTEL_STAY_POLICY.CHECK_OUT_HOUR, 0, 0, 0);
    return result;
};

export const createDefaultStay = () => {
    const checkIn = withHotelTime(new Date(), 'checkIn');
    const checkOut = withHotelTime(new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1), 'checkOut');
    return { checkIn, checkOut };
};

export const getMinimumCheckOut = (checkIn) => {
    const arrival = new Date(checkIn);
    return withHotelTime(new Date(arrival.getFullYear(), arrival.getMonth(), arrival.getDate() + 1), 'checkOut');
};

export const getStaySurchargeRates = (checkIn, checkOut) => {
    const inHour = new Date(checkIn).getHours() + new Date(checkIn).getMinutes() / 60;
    const outHour = new Date(checkOut).getHours() + new Date(checkOut).getMinutes() / 60;
    let earlyCheckIn = 0;
    let lateCheckOut = 0;
    if (inHour >= 5 && inHour < 9) earlyCheckIn = 0.5;
    else if (inHour >= 9 && inHour < 14) earlyCheckIn = 0.3;
    if (outHour > 12 && outHour <= 15) lateCheckOut = 0.3;
    else if (outHour > 15 && outHour <= 18) lateCheckOut = 0.5;
    else if (outHour > 18) lateCheckOut = 1;
    return { earlyCheckIn, lateCheckOut };
};

export const attachStandardTime = (dateValue, type) => {
    if (!dateValue) return dateValue;
    if (String(dateValue).includes('T')) return dateValue;
    return `${dateValue}T${type === 'checkIn' ? '14:00:00' : '12:00:00'}`;
};
