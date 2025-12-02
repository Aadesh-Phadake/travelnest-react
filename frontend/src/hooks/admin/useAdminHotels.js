import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHotels, deleteHotel } from '../../redux/admin/hotelsSlice';

export const useAdminHotels = () => {
    const dispatch = useDispatch();
    const { hotels, loading, error } = useSelector((state) => state.hotels);

    useEffect(() => {
        dispatch(fetchHotels());
    }, [dispatch]);

    const removeHotel = (id) => {
        if (window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
            dispatch(deleteHotel(id));
        }
    };

    return {
        hotels,
        loading,
        error,
        removeHotel
    };
};
