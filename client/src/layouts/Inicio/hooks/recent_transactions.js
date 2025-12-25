import { useState, useEffect } from "react";
import axios from "@/api/axios";

const useRecentTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Fetch last 5 sales
            const response = await axios.get("/ventas?limit=5&page=1");
            if (response.data && response.data.data) {
                setTransactions(response.data.data);
            } else {
                setTransactions([]);
            }
            setError(null);
        } catch (err) {
            console.error("Error fetching recent transactions:", err);
            setError(err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const refetch = () => {
        fetchTransactions();
    };

    return { transactions, loading, error, refetch };
};

export default useRecentTransactions;
