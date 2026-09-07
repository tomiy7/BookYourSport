"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import PlayerHeader from "./PlayerHeader";

import {
    getAccessToken,
} from "@/lib/auth";

import {
    getBalance,
    topUp,
} from "@/lib/paymentApi";

import {
    getDashboardPath,
    getStoredUser,
    refreshCurrentUser,
} from "@/lib/user";

import {
    Contract,
    generateContract,
    getContractByUser,
    getContractDocumentUrl,
    paySubscription,
    signContract,
} from "@/lib/contractApi";


interface User {
    id?: string;
    userId?: string;

    firstName: string;
    lastName: string;
    email: string;

    city?: string | null;
    dateOfBirth?: string | null;

    role: string;

    approvalStatus?: string | null;

    contractStatus?: string | null;

    subscriptionStatus?: string | null;
}


function formatPrice(
    amount: number,
    currency = "RSD"
) {
    return new Intl.NumberFormat(
        "sr-Latn-RS",
        {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }
    ).format(amount);
}


function getUserId(
    user: User | null
) {
    if (!user) {
        return null;
    }

    return (
        user.id ||
        user.userId ||
        null
    );
}


function normalizeStatus(
    status?: string | null
) {
    return (
        status ||
        ""
    )
        .trim()
        .toLowerCase();
}



// ==========================================
// TOP UP MODAL
// Isti modal kao kod rezervacije.
// Prikazuje se kada korisnik nema dovoljno
// kredita za plaćanje Club Owner pretplate.
// ==========================================

function TopUpModal({
                        onClose,
                        onSuccess,
                    }: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [balance, setBalance] =
        useState<number | null>(null);

    const [currency, setCurrency] =
        useState("RSD");

    const [amount, setAmount] =
        useState("");

    const [loadingBalance, setLoadingBalance] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const token =
            getAccessToken();

        if (!token) {
            return;
        }

        getBalance()
            .then((wallet) => {
                setBalance(wallet.balance);
                setCurrency(wallet.currency);
            })
            .catch(() =>
                setError(
                    "Nije moguće učitati trenutno stanje."
                )
            )
            .finally(() =>
                setLoadingBalance(false)
            );
    }, []);

    async function handleTopUp() {
        const token =
            getAccessToken();

        if (!token) {
            return;
        }

        const numericAmount =
            Number(amount);

        if (
            !numericAmount ||
            numericAmount < 100
        ) {
            setError(
                "Unesi iznos od najmanje 100 RSD."
            );
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await topUp(
                numericAmount,
                currency
            );

            onSuccess();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Uplata nije uspela."
            );

            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">

                <h3 className="text-xl font-bold text-zinc-900">
                    Nemaš dovoljno kredita
                </h3>

                <p className="mt-2 text-sm text-zinc-600">
                    Dopuni stanje da bi mogao/la da završiš
                    plaćanje Club Owner pretplate.
                    Nastavljamo tačno tamo gde smo stali.
                </p>

                <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4">

                    <p className="text-xs text-zinc-500">
                        Trenutno stanje
                    </p>

                    <p className="mt-1 text-2xl font-bold text-zinc-800">
                        {loadingBalance
                            ? "Učitavanje..."
                            : formatPrice(
                                balance ?? 0,
                                currency
                            )}
                    </p>

                </div>

                <label
                    htmlFor="subscription-topup-amount"
                    className="mb-2 mt-5 block text-sm font-semibold text-zinc-700"
                >
                    Iznos dopune
                </label>

                <input
                    id="subscription-topup-amount"
                    type="number"
                    min="100"
                    placeholder="Unesi iznos"
                    value={amount}
                    onChange={(e) =>
                        setAmount(e.target.value)
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
                />

                {error && (
                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex gap-3">

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                    >
                        Otkaži
                    </button>

                    <button
                        type="button"
                        onClick={handleTopUp}
                        disabled={submitting}
                        className="flex-1 rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting
                            ? "Uplata u toku..."
                            : "Uplati i nastavi"}
                    </button>

                </div>

            </div>
        </div>
    );
}


export default function PlayerDashboard() {

    const router =
        useRouter();


    // ==========================================
    // USER
    // ==========================================

    const [user, setUser] =
        useState<User | null>(null);


    // ==========================================
    // WALLET
    // ==========================================

    const [balance, setBalance] =
        useState(0);

    const [currency, setCurrency] =
        useState("RSD");

    const [
        walletLoading,
        setWalletLoading,
    ] = useState(true);


    // ==========================================
    // CONTRACT
    // ==========================================

    const [contract, setContract] =
        useState<Contract | null>(null);

    const [
        contractLoading,
        setContractLoading,
    ] = useState(true);

    const [
        contractActionLoading,
        setContractActionLoading,
    ] = useState(false);


    // ==========================================
    // SUBSCRIPTION
    // ==========================================

    const [
        subscriptionLoading,
        setSubscriptionLoading,
    ] = useState(false);


    // ==========================================
    // GENERAL
    // ==========================================

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");

    const [
        showTopUpModal,
        setShowTopUpModal,
    ] = useState(false);


    // ==========================================
    // LOAD USER
    // ==========================================

    const loadUser =
        useCallback(async () => {

            const accessToken =
                getAccessToken();

            const savedUser =
                getStoredUser();


            if (
                !accessToken ||
                !savedUser
            ) {
                router.replace(
                    "/login"
                );

                return null;
            }


            try {

                const refreshedUser =
                    await refreshCurrentUser();

                const typedUser =
                    refreshedUser as User;

                const dashboardPath =
                    getDashboardPath(
                        typedUser.role
                    );


                if (
                    dashboardPath !==
                    "/player-dashboard"
                ) {
                    router.replace(
                        dashboardPath
                    );

                    return null;
                }


                setUser(
                    typedUser
                );

                return typedUser;

            } catch (error) {

                console.error(
                    "Greška prilikom osvežavanja korisnika:",
                    error
                );


                // Ako refresh trenutno ne uspe,
                // koristimo poslednje sačuvane podatke.

                const typedUser =
                    savedUser as User;

                const dashboardPath =
                    getDashboardPath(
                        typedUser.role
                    );


                if (
                    dashboardPath !==
                    "/player-dashboard"
                ) {
                    router.replace(
                        dashboardPath
                    );

                    return null;
                }


                setUser(
                    typedUser
                );

                return typedUser;
            }

        }, [
            router,
        ]);


    // ==========================================
    // LOAD WALLET
    // ==========================================

    const loadWallet =
        useCallback(async () => {

            const token =
                getAccessToken();


            if (!token) {

                setWalletLoading(
                    false
                );

                return;
            }


            try {

                setWalletLoading(
                    true
                );


                const wallet =
                    await getBalance();


                setBalance(
                    wallet.balance
                );


                setCurrency(
                    wallet.currency
                );

            } catch (error) {

                console.error(
                    "Greška prilikom učitavanja stanja na računu:",
                    error
                );

            } finally {

                setWalletLoading(
                    false
                );
            }

        }, []);


    // ==========================================
    // LOAD CONTRACT
    // ==========================================

    const loadContract =
        useCallback(async (
            currentUser: User | null
        ) => {

            const userId =
                getUserId(
                    currentUser
                );


            if (!userId) {

                setContract(
                    null
                );

                setContractLoading(
                    false
                );

                return;
            }


            try {

                setContractLoading(
                    true
                );


                const contractData =
                    await getContractByUser(
                        userId
                    );


                setContract(
                    contractData
                );

            } catch (error) {

                console.error(
                    "Greška prilikom učitavanja ugovora:",
                    error
                );


                setContract(
                    null
                );

            } finally {

                setContractLoading(
                    false
                );
            }

        }, []);


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        async function initialize() {

            setLoading(
                true
            );


            const currentUser =
                await loadUser();


            if (!currentUser) {

                setLoading(
                    false
                );

                return;
            }


            const approvalStatus =
                normalizeStatus(
                    currentUser.approvalStatus
                );

            const contractStatus =
                normalizeStatus(
                    currentUser.contractStatus
                );

            const userId =
                getUserId(
                    currentUser
                );


            // ==========================================
            // AUTO GENERATE CONTRACT
            // ==========================================

            if (
                approvalStatus ===
                "approved" &&

                contractStatus !==
                "generated" &&

                contractStatus !==
                "signed" &&

                userId
            ) {

                try {

                    setContractLoading(
                        true
                    );


                    const generatedContract =
                        await generateContract(
                            userId
                        );


                    setContract(
                        generatedContract
                    );


                    const refreshedUser =
                        await refreshCurrentUser();


                    const typedUser =
                        refreshedUser as User;


                    setUser(
                        typedUser
                    );

                } catch (error) {

                    console.error(
                        "Greška prilikom automatskog generisanja ugovora:",
                        error
                    );


                    setError(
                        "Nije moguće automatski generisati ugovor."
                    );

                } finally {

                    setContractLoading(
                        false
                    );
                }

            } else {

                await loadContract(
                    currentUser
                );
            }


            // ==========================================
            // LOAD WALLET
            // ==========================================

            await loadWallet();


            setLoading(
                false
            );
        }


        initialize();

    }, [
        loadUser,
        loadWallet,
        loadContract,
    ]);


    // ==========================================
    // SIGN CONTRACT
    // ==========================================

    async function handleSignContract() {

        if (!contract) {
            return;
        }


        try {

            setError("");

            setSuccessMessage("");

            setContractActionLoading(
                true
            );


            const signedContract =
                await signContract(
                    contract.contractId
                );


            setContract({
                ...contract,
                ...signedContract,
            });


            setSuccessMessage(
                "Ugovor je uspešno potpisan. Sada možeš nastaviti na plaćanje pretplate."
            );

        } catch (error) {

            setError(
                error instanceof Error
                    ? error.message
                    : "Potpisivanje ugovora nije uspelo."
            );

        } finally {

            setContractActionLoading(
                false
            );
        }
    }


    // ==========================================
    // PAY SUBSCRIPTION
    // ==========================================

    async function handlePaySubscription() {

        const userId =
            getUserId(user);


        if (!userId) {

            setError(
                "Nije moguće pronaći ID korisnika."
            );

            return;
        }


        try {

            setError("");

            setSuccessMessage("");

            setSubscriptionLoading(
                true
            );


            // Subscription amount and currency
            // are defined by the backend configuration.
            const result =
                await paySubscription(
                    userId
                );


            if (!result.isSuccessful) {

                throw new Error(
                    "Plaćanje pretplate nije uspešno."
                );
            }


            setSuccessMessage(
                "Pretplata je uspešno plaćena. Tvoj Club Owner nalog se aktivira."
            );


            const refreshedUser =
                await refreshCurrentUser();


            const typedUser =
                refreshedUser as User;


            setUser(
                typedUser
            );


            const newDashboardPath =
                getDashboardPath(
                    typedUser.role
                );


            if (
                newDashboardPath !==
                "/player-dashboard"
            ) {
                router.replace(
                    newDashboardPath
                );
            }

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Plaćanje pretplate nije uspelo.";

            const isInsufficientCredit =
                errorMessage
                    .toLowerCase()
                    .includes("nedovoljno sredstava");

            if (isInsufficientCredit) {
                setError("");
                setShowTopUpModal(true);
            } else {
                setError(errorMessage);
            }

        } finally {

            setSubscriptionLoading(
                false
            );
        }
    }


    // ==========================================
    // OPEN CONTRACT
    // ==========================================

    function handleOpenContract() {

        if (!contract) {
            return;
        }


        const documentUrl =
            getContractDocumentUrl(
                contract.contractId
            );


        window.open(
            documentUrl,
            "_blank"
        );
    }


    // ==========================================
    // STATUS VALUES
    // ==========================================

    const approvalStatus =
        normalizeStatus(
            user?.approvalStatus
        );

    const contractStatus =
        normalizeStatus(
            contract?.status
        );


    const isRequested =
        approvalStatus ===
        "requested";

    const isPending =
        approvalStatus ===
        "pending";

    const isWaitingForApproval =
        isRequested ||
        isPending;

    const isApproved =
        approvalStatus ===
        "approved";

    const isRejected =
        approvalStatus ===
        "rejected";


    const canRequestOwnerAccount =
        !isWaitingForApproval &&
        !isApproved;


    const isContractGenerated =
        contractStatus ===
        "generated" ||
        contractStatus ===
        "pendingsignature" ||
        contractStatus ===
        "pending_signature";


    const isContractSigned =
        contractStatus ===
        "signed";


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f7]">

                <p className="text-zinc-500">
                    Učitavanje...
                </p>

            </main>
        );
    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <main className="min-h-screen bg-[#f7f8f7]">

            <PlayerHeader />


            <section className="mx-auto w-full max-w-6xl px-6 py-10">

                {/* ================================= */}
                {/* NASLOV */}
                {/* ================================= */}

                <div className="mb-9">

                    <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                        MOJ NALOG
                    </span>


                    <h1 className="mt-2 text-3xl font-bold text-zinc-800">
                        Pregled naloga
                    </h1>


                    <p className="mt-3 text-zinc-600">
                        Upravljaj svojim rezervacijama,
                        stanjem na računu i podacima
                        na jednom mestu.
                    </p>

                </div>


                {/* ================================= */}
                {/* SUCCESS */}
                {/* ================================= */}

                {successMessage && (

                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-800">
                        {successMessage}
                    </div>
                )}


                {/* ================================= */}
                {/* ERROR */}
                {/* ================================= */}

                {error && (

                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
                        {error}
                    </div>
                )}


                {/* ================================= */}
                {/* CLUB OWNER ACTIVATION */}
                {/* ================================= */}

                <section className="rounded-xl border border-zinc-200 bg-white p-6">

                    <div>

                        <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                            CLUB OWNER AKTIVACIJA
                        </span>


                        <h2 className="mt-2 text-2xl font-bold text-zinc-800">
                            Status aktivacije Club Owner naloga
                        </h2>


                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                            Prati ceo proces od zahteva,
                            preko ugovora i potpisa,
                            do aktivacije Club Owner naloga.
                        </p>

                    </div>


                    {/* STATUS CARDS */}

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">

                            <p className="text-sm text-zinc-500">
                                Club Owner zahtev
                            </p>


                            <p className="mt-2 text-lg font-bold text-zinc-800">

                                {isApproved
                                    ? "Odobren"
                                    : isRejected
                                        ? "Odbijen"
                                        : isWaitingForApproval
                                            ? "Zahtev je poslat"
                                            : "Nije poslat"}

                            </p>

                        </div>


                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">

                            <p className="text-sm text-zinc-500">
                                Ugovor
                            </p>


                            <p className="mt-2 text-lg font-bold text-zinc-800">

                                {contractLoading
                                    ? "Učitavanje..."
                                    : !contract
                                        ? "Nije generisan"
                                        : isContractSigned
                                            ? "Potpisan"
                                            : isContractGenerated
                                                ? "Čeka potpis"
                                                : contract.status}

                            </p>

                        </div>


                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">

                            <p className="text-sm text-zinc-500">
                                Subscription
                            </p>


                            <p className="mt-2 text-lg font-bold text-zinc-800">

                                {isContractSigned
                                    ? "Spremna za plaćanje"
                                    : "Nije dostupna"}

                            </p>

                        </div>

                    </div>


                    {/* REQUEST CLUB OWNER */}

                    {canRequestOwnerAccount && (

                        <div className="mt-6 rounded-xl border border-zinc-200 p-5">

                            {isRejected && (

                                <div className="mb-4">

                                    <h3 className="font-semibold text-red-700">
                                        Prethodni zahtev je odbijen
                                    </h3>


                                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                                        Možeš ponovo poslati zahtev
                                        za Club Owner nalog.
                                    </p>

                                </div>
                            )}


                            {!isRejected && (

                                <p className="text-sm leading-6 text-zinc-600">
                                    Ako upravljaš sportskim klubom,
                                    možeš poslati zahtev za
                                    Club Owner nalog.
                                </p>
                            )}


                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/player-dashboard/owner-request"
                                    )
                                }
                                className="mt-4 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                                Zatraži Club Owner nalog
                            </button>

                        </div>
                    )}


                    {/* REQUEST WAITING */}

                    {isWaitingForApproval && (

                        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

                            <h3 className="font-semibold text-zinc-800">
                                Zahtev čeka administrativnu odluku
                            </h3>


                            <p className="mt-2 text-sm leading-6 text-zinc-600">
                                Tvoj zahtev za Club Owner nalog je poslat.
                                Administrator još nije odobrio
                                ili odbio zahtev.
                            </p>

                        </div>
                    )}


                    {/* APPROVED - WAITING CONTRACT */}

                    {isApproved &&
                        !contractLoading &&
                        !contract && (

                            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                                <h3 className="font-semibold text-zinc-800">
                                    Zahtev je odobren
                                </h3>


                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                    Tvoj zahtev je odobren.
                                    Ugovor se generiše automatski
                                    kao sledeći korak aktivacije.
                                </p>


                                <button
                                    type="button"
                                    onClick={() =>
                                        loadContract(
                                            user
                                        )
                                    }
                                    className="mt-4 rounded-lg border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                                >
                                    Osveži status ugovora
                                </button>

                            </div>
                        )}


                    {/* GENERATED CONTRACT */}

                    {contract &&
                        isContractGenerated && (

                            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

                                <h3 className="font-semibold text-zinc-800">
                                    Ugovor je spreman za potpis
                                </h3>


                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                    Pregledaj generisani ugovor,
                                    a zatim potvrdi njegovo
                                    potpisivanje.
                                </p>


                                <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                                    <button
                                        type="button"
                                        onClick={
                                            handleOpenContract
                                        }
                                        className="rounded-lg border border-green-700 px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                                    >
                                        Pogledaj ugovor
                                    </button>


                                    <button
                                        type="button"
                                        onClick={
                                            handleSignContract
                                        }
                                        disabled={
                                            contractActionLoading
                                        }
                                        className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {contractActionLoading
                                            ? "Potpisivanje..."
                                            : "Potpiši ugovor"}
                                    </button>

                                </div>

                            </div>
                        )}


                    {/* SIGNED CONTRACT */}

                    {contract &&
                        isContractSigned && (

                            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">

                                <h3 className="font-semibold text-zinc-800">
                                    Ugovor je potpisan
                                </h3>


                                <p className="mt-2 text-sm leading-6 text-zinc-600">
                                    Sledeći korak je plaćanje
                                    Club Owner pretplate.
                                </p>


                                <div className="mt-5 max-w-md">

                                    {/* FIXED SUBSCRIPTION PRICE */}

                                    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4">

                                        <p className="text-sm text-zinc-500">
                                            Iznos pretplate
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-zinc-800">
                                            10.000 RSD
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            handlePaySubscription
                                        }
                                        disabled={
                                            subscriptionLoading
                                        }
                                        className="mt-4 w-full rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {subscriptionLoading
                                            ? "Obrada plaćanja..."
                                            : "Plati pretplatu"}
                                    </button>

                                </div>

                            </div>
                        )}

                </section>


                {/* ================================= */}
                {/* REZERVACIJE */}
                {/* ================================= */}

                <section className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">

                    <div className="border-b border-zinc-200 px-6 py-5">

                        <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                            REZERVACIJE
                        </span>


                        <h2 className="mt-2 text-2xl font-bold text-zinc-800">
                            Moje rezervacije
                        </h2>


                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                            Pregled aktivnih i prethodnih rezervacija
                            na jednom mestu.
                        </p>

                    </div>


                    {/* AKTIVNE REZERVACIJE */}

                    <div className="border-b border-zinc-200 px-6 py-7">

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h3 className="text-lg font-semibold text-zinc-800">
                                    Aktivne rezervacije
                                </h3>


                                <p className="mt-1 text-sm text-zinc-500">
                                    Pregled tvojih predstojećih termina.
                                </p>


                                <p className="mt-4 text-sm text-zinc-600">
                                    Pogledaj svoje aktivne i predstojeće
                                    rezervacije.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/player-dashboard/reservation"
                                    )
                                }
                                className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                                Pogledaj rezervacije
                            </button>

                        </div>

                    </div>


                    {/* ISTORIJA REZERVACIJA */}

                    <div className="px-6 py-7">

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <h3 className="text-lg font-semibold text-zinc-800">
                                    Istorija rezervacija
                                </h3>


                                <p className="mt-1 text-sm text-zinc-500">
                                    Pregled svih prethodnih termina.
                                </p>


                                <p className="mt-4 text-sm leading-6 text-zinc-600">
                                    Pogledaj sve svoje prethodne
                                    rezervacije i njihov status.
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/player-dashboard/reservation"
                                    )
                                }
                                className="shrink-0 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                            >
                                Pogledaj kompletnu istoriju
                            </button>

                        </div>

                    </div>

                </section>


                {/* ================================= */}
                {/* STANJE NA RAČUNU */}
                {/* ================================= */}

                <section
                    onClick={() =>
                        router.push(
                            "/player-dashboard/wallet"
                        )
                    }
                    className="mt-8 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                >

                    <div className="border-b border-zinc-200 px-6 py-5">

                        <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                            NOVČANIK
                        </span>


                        <h2 className="mt-2 text-2xl font-bold text-zinc-800">
                            Stanje na računu
                        </h2>


                        <p className="mt-1 text-sm text-zinc-500">
                            Pregled dostupnog kredita za rezervacije.
                        </p>

                    </div>


                    <div className="px-6 py-7">

                        <p className="text-sm text-zinc-500">
                            Trenutno stanje
                        </p>


                        <h3 className="mt-2 text-3xl font-bold text-zinc-800">

                            {walletLoading
                                ? "Učitavanje..."
                                : formatPrice(
                                    balance,
                                    currency
                                )}

                        </h3>


                        <p className="mt-2 text-sm text-zinc-500">
                            Kredit možeš koristiti za plaćanje rezervacija.
                        </p>


                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();

                                    router.push(
                                        "/player-dashboard/topup"
                                    );
                                }}
                                className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 sm:min-w-[220px]"
                            >
                                Dodaj kredit
                            </button>

                        </div>

                    </div>

                </section>


                {/* ================================= */}
                {/* LIČNI PODACI */}
                {/* ================================= */}

                <section
                    onClick={() =>
                        router.push(
                            "/player-dashboard/profile"
                        )
                    }
                    className="mt-8 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-green-300 hover:shadow-md"
                >

                    <div className="border-b border-zinc-200 px-6 py-5">

            <span className="text-xs font-bold tracking-[0.18em] text-green-800">
                MOJ PROFIL
            </span>


                        <h2 className="mt-2 text-2xl font-bold text-zinc-800">
                            Lični podaci
                        </h2>


                        <p className="mt-1 text-sm text-zinc-500">
                            Podaci povezani sa tvojim nalogom.
                        </p>

                    </div>


                    {/* PODACI - JEDNO PORED DRUGOG */}

                    <div className="grid grid-cols-1 gap-6 px-6 py-7 sm:grid-cols-2 lg:grid-cols-4">

                        {/* IME */}

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Ime
                            </p>


                            <p className="mt-2 text-sm font-semibold text-zinc-800">
                                {user?.firstName || "-"}
                            </p>

                        </div>


                        {/* PREZIME */}

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Prezime
                            </p>


                            <p className="mt-2 text-sm font-semibold text-zinc-800">
                                {user?.lastName || "-"}
                            </p>

                        </div>


                        {/* EMAIL */}

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Email
                            </p>


                            <p className="mt-2 break-all text-sm font-semibold text-zinc-800">
                                {user?.email || "-"}
                            </p>

                        </div>


                        {/* GRAD */}

                        <div>

                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                                Grad
                            </p>


                            <p className="mt-2 text-sm font-semibold text-zinc-800">
                                {user?.city || "-"}
                            </p>

                        </div>

                    </div>


                    <div className="border-t border-zinc-200 px-6 py-5">

            <span className="text-sm font-semibold text-green-800">
                Izmeni lične podatke
            </span>

                    </div>

                </section>



            </section>

            {showTopUpModal && (
                <TopUpModal
                    onClose={() =>
                        setShowTopUpModal(false)
                    }
                    onSuccess={async () => {
                        setShowTopUpModal(false);

                        await loadWallet();

                        await handlePaySubscription();
                    }}
                />
            )}

        </main>
    );
}