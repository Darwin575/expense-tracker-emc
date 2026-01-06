"use client";

import { useState, useMemo } from "react";
import { useToast } from "@/components/Toast";

import Modal from "@/components/Modal";
import { PaginationFooter } from "@/components/paginationfooter";
import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "@/hooks/useCategories";
import { useExpenses, useDeleteExpense } from "@/hooks/useExpenses";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ProtectedRoute } from "@/components/ProtectedRoute"

interface CategoryFormData {
    name: string;
    description: string;
    color_code: string;
}

export default function CategoriesPage() {
    const { data: categories, isLoading } = useCategories();
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();
    const { showToast } = useToast()
    const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteExpensesModalOpen, setIsDeleteExpensesModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [relatedExpensesCount, setRelatedExpensesCount] = useState(0);
    const [shouldDeleteRelatedExpenses, setShouldDeleteRelatedExpenses] = useState(false);

    const { data: expenses } = useExpenses();
    const deleteExpense = useDeleteExpense();

    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        description: "",
        color_code: "#000000",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Autocomplete Data
    const uniqueNames = useMemo(() => {
        if (!categories) return []
        const list = Array.isArray(categories) ? categories : (categories as any).results || []
        return Array.from(new Set(list.map((c: any) => c.name))).sort() as string[]
    }, [categories])

    const uniqueDescriptions = useMemo(() => {
        if (!categories) return []
        const list = Array.isArray(categories) ? categories : (categories as any).results || []
        return Array.from(new Set(list.map((c: any) => c.description).filter(Boolean))).sort() as string[]
    }, [categories])

    const resetForm = () => {
        setFormData({ name: "", description: "", color_code: "#000000" });
        setEditingId(null);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (category: any) => {
        setFormData({
            name: category.name,
            description: category.description || "",
            color_code: category.color_code || "#000000",
        });
        setEditingId(category.id);
        setIsModalOpen(true);
    };


    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setShouldDeleteRelatedExpenses(false); // Reset flag

        // Check for related expenses
        if (expenses) {
            const related = expenses.filter((e: any) => e.category === id);
            if (related.length > 0) {
                setRelatedExpensesCount(related.length);
                setIsDeleteExpensesModalOpen(true);
                return;
            }
        }

        setIsDeleteModalOpen(true);
    };

    const handleConfirmDeleteExpenses = () => {
        setShouldDeleteRelatedExpenses(true);
        setIsDeleteExpensesModalOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleSkipDeleteExpenses = () => {
        setShouldDeleteRelatedExpenses(false);
        setIsDeleteExpensesModalOpen(false);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            // 1. Delete Category
            await deleteCategory.mutateAsync(deleteId);
            showToast('Category deleted successfully', 'success')

            // 2. If successful and flag set, delete related expenses
            if (shouldDeleteRelatedExpenses && expenses) {
                const related = expenses.filter((e: any) => e.category === deleteId);
                if (related.length > 0) {
                    await Promise.all(related.map((e: any) => deleteExpense.mutateAsync(e.id)));
                    showToast(`${related.length} related expenses deleted`, 'success');
                }
            }

            setIsDeleteModalOpen(false);
            setDeleteId(null);
            setShouldDeleteRelatedExpenses(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || error.message || 'Failed to delete category';
            showToast(message, 'error')
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (editingId) {
                await updateCategory.mutateAsync({ id: editingId, ...formData });
                showToast('Category updated successfully', 'success')
            } else {
                await createCategory.mutateAsync(formData);
                showToast('Category created successfully', 'success')
            }
            resetForm();
            setIsModalOpen(false);
        } catch (error: any) {
            let message = 'Something went wrong';
            if (error?.response?.data) {
                const data = error.response.data;

                // Helper to check for common duplicate patterns
                const isDuplicateError = (msg: string) =>
                    msg.toLowerCase().includes('unique') ||
                    msg.toLowerCase().includes('already exists') ||
                    (msg.toLowerCase().includes('user') && msg.toLowerCase().includes('name'));

                if (typeof data === 'string') {
                    message = isDuplicateError(data) ? 'A category with this name already exists.' : data;
                } else {
                    // Collect all error messages
                    const errorDetails: string[] = [];

                    // Check fields and non_field_errors
                    Object.entries(data).forEach(([key, val]) => {
                        const messages = Array.isArray(val) ? val : [val];
                        messages.forEach((msg: any) => {
                            const msgStr = String(msg);
                            if (isDuplicateError(msgStr)) {
                                errorDetails.push('A category with this name already exists.');
                            } else if (key !== 'non_field_errors') {
                                const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                                errorDetails.push(`${fieldName}: ${msgStr}`);
                            } else {
                                errorDetails.push(msgStr);
                            }
                        });
                    });

                    if (errorDetails.length > 0) {
                        // Deduplicate and join
                        message = Array.from(new Set(errorDetails)).join(', ');
                    }
                }
            } else if (error.message) {
                message = error.message;
            }
            showToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        const query = searchQuery.toLowerCase().trim();
        if (!query) return categories;

        const searchTerms = query.split(/\s+/);

        return categories.filter((cat: any) => {
            const name = cat.name.toLowerCase();
            const description = (cat.description || '').toLowerCase();

            return searchTerms.every(term =>
                name.includes(term) || description.includes(term)
            );
        });
    }, [categories, searchQuery]);

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCategories.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCategories, currentPage, itemsPerPage]);

    return (
        <ProtectedRoute>
            <div className="p-4 lg:p-8 bg-white dark:bg-slate-900 min-h-screen flex flex-col">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Categories
                        </h1>
                    </div>
                </div>

                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search"
                        className="md:w-[400px] md:h-[40px] pl-10 pr-10 py-2.5 rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-500 outline-none transition"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none md:right-auto md:left-[365px]">
                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto justify-end mb-10">
                    <button
                        onClick={handleOpenAdd}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium py-2.5 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Category
                    </button>
                </div>

                {/* List */}
                <>
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading categories...</p>
                            </div>
                        ) : paginatedCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] text-[#6A89A7]" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.8281-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z" /></svg>
                                <h1 className="text-2xl font-semibold">No Categories Found</h1>
                                <p className="text-slate-500 dark:text-slate-400">Try adding a category by clicking add category</p>
                            </div>
                        ) : (
                            paginatedCategories.map((cat: any) => (
                                <div
                                    key={cat.id}
                                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-4 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                {cat.name}
                                            </h3>
                                            {cat.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                    {cat.description}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className="inline-block w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 ml-3 flex-shrink-0"
                                            style={{ backgroundColor: cat.color_code }}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="flex-1 bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-4 py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(cat.id)}
                                            className="flex-1 bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-4 py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-3">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                <p className="mt-4 text-slate-600 dark:text-slate-400">Loading categories...</p>
                            </div>
                        ) : paginatedCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] text-[#6A89A7]" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.8281-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z" /></svg>
                                <h1 className="text-2xl font-semibold">No Categories Found</h1>
                                <p className="text-slate-500 dark:text-slate-400">Try adding a category by clicking add category</p>
                            </div>
                        ) : (
                            paginatedCategories.map((cat: any) => (
                                <div
                                    key={cat.id}
                                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-4 shadow-sm"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                {cat.name}
                                            </h3>
                                            {cat.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                    {cat.description}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className="inline-block w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600 ml-3 flex-shrink-0"
                                            style={{ backgroundColor: cat.color_code }}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => handleEdit(cat)}
                                            className="flex-1 bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-4 py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(cat.id)}
                                            className="flex-1 bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-4 py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Tablet/Desktop Table Layout */}
                    <div className="hidden md:block overflow-hidden rounded-xl border dark:border-slate-700">
                        <table className="w-full table-fixed text-left border-collapse bg-white dark:bg-slate-900">
                            {(paginatedCategories.length > 0) && (
                                <thead>
                                    <tr className="bg-white dark:bg-slate-800">
                                        <th className="py-4 px-4 text-lg font-medium text-slate-500 dark:text-slate-400 border-r border-r-slate-300 dark:border-slate-700">Name</th>
                                        <th className="py-4 px-4 text-lg font-medium text-slate-500 dark:text-slate-400 border-r border-r-slate-300 dark:border-slate-700">
                                            <span className="hidden md:inline">Description</span>
                                        </th>
                                        <th className="py-4 px-4 text-lg font-medium text-slate-500 dark:text-slate-400 border-r border-r-slate-300 dark:border-slate-700">Color</th>
                                        <th className="py-4 px-4 text-lg font-medium text-slate-500 dark:text-slate-400 border-r border-r-slate-300 dark:border-slate-700 text-right">Actions</th>
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 border-r border-r-slate-300 dark:border-slate-700">
                                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-400"></div>
                                            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading categories...</p>
                                        </td>
                                    </tr>
                                ) : paginatedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-12 border-r border-slate-300 dark:border-slate-700">
                                            <div className=" flex flex-col items-center justify-center gap-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-[200px] h-[200px] text-[#6A89A7]" width="512" height="512" viewBox="0 0 512 512"><path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.8281-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z" /></svg>
                                                <h1 className="text-2xl font-semibold text-4xl">No Categories Found</h1>
                                                <p className="text-slate-500 dark:text-slate-400 text-xl">Try adding an expense by clicking add expense</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {paginatedCategories.map((cat: any, index: number) => (
                                            <tr
                                                key={cat.id}
                                                className={`hover:!bg-slate-200 dark:hover:!bg-slate-700 transition-colors ${index % 2 === 0
                                                    ? 'bg-white dark:bg-slate-900'
                                                    : 'bg-dove-blue dark:bg-slate-800/50'
                                                    }`}
                                            >
                                                <td className="w-[180px] truncate overflow-hidden whitespace-nowrap py-4 px-4 text-slate-900 dark:text-slate-100 text-sm font-medium border border-slate-300 dark:border-slate-700">
                                                    {cat.name}
                                                </td>

                                                <td className="w-[280px] py-4 px-4 text-slate-600 dark:text-slate-400 text-sm border border-slate-300 dark:border-slate-700">
                                                    <span className="block truncate overflow-hidden whitespace-nowrap">
                                                        {cat.description || "-"}
                                                    </span>
                                                </td>
                                                <td className="w-[80px] py-4 px-4 border border-slate-300 dark:border-slate-700 text-center">
                                                    <span
                                                        className="inline-block w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600"
                                                        style={{ backgroundColor: cat.color_code }}
                                                    />
                                                </td>
                                                <td className="w-[200px] py-4 px-4 border border-slate-300 dark:border-slate-700">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleEdit(cat)}
                                                            className="bg-[#497E21] dark:bg-[#497E21]/80 dark:hover:bg-[#497E21]/70 px-4 py-2 rounded text-white hover:bg-[#497E21]/80 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(cat.id)}
                                                            className="bg-[#D90000] dark:bg-[#D90000]/80 dark:hover:bg-[#D90000]/70 px-4 py-2 rounded text-white hover:bg-[#D90000]/80 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Empty placeholder rows */}
                                        {Array.from({ length: Math.max(0, itemsPerPage - paginatedCategories.length) }).map((_, index) => (
                                            <tr
                                                key={`empty-${index}`}
                                                className={`${(paginatedCategories.length + index) % 2 === 0
                                                    ? 'bg-white dark:bg-slate-900'
                                                    : 'bg-dove-blue dark:bg-slate-800/50'
                                                    }`}
                                            >
                                                <td className="py-4 px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                <td className="py-4 px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                <td className="py-4 px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                                <td className="py-4 px-4 border border-slate-300 dark:border-slate-700">&nbsp;</td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>

                {/* Pagination Controls */}
                <div className="mt-auto">
                    <PaginationFooter
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredCategories.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                    />
                </div>

                <Dialog open={isConfirmCancelOpen} onOpenChange={setIsConfirmCancelOpen}>
                    <DialogContent className="bg-graphite dark:bg-slate-900">
                        <DialogHeader>
                            <DialogTitle>Confirm Cancellation</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel? Your changes won't be saved.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <button
                                onClick={() => {
                                    setIsConfirmCancelOpen(false);
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="bg-red-600 text-white hover:bg-red-700 font-medium py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setIsConfirmCancelOpen(false)}
                                className="bg-green-grass hover:bg-lime-700 text-white font-medium py-2 px-4 rounded-lg"
                            >
                                Keep editing
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add / Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsConfirmCancelOpen(true)}
                    title={editingId ? "Edit Category" : "Add Category"}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1">Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    name="name"
                                    required
                                    maxLength={50}
                                    value={formData.name}
                                    onChange={handleChange}
                                    list="category-name-suggestions"
                                    className="w-full px-4 py-2 border rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 pr-10"
                                    placeholder="Category name"
                                />
                                <datalist id="category-name-suggestions">
                                    {uniqueNames.map((name) => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                                {formData.name && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, name: '' }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <p className="text-xs mt-1">{formData.name.length}/50</p>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Description</label>
                            <input
                                name="description"
                                maxLength={200}
                                value={formData.description}
                                onChange={handleChange}
                                list="category-description-suggestions"
                                className="w-full px-4 py-2 border rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                                placeholder="Optional description..."
                            />
                            <datalist id="category-description-suggestions">
                                {uniqueDescriptions.map((desc) => (
                                    <option key={desc} value={desc} />
                                ))}
                            </datalist>
                            <p className="text-xs mt-1">{formData.description.length}/200</p>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Color</label>
                            <input
                                type="color"
                                name="color_code"
                                value={formData.color_code}
                                onChange={handleChange}
                                className="w-16 h-10 p-1 border rounded cursor-pointer"
                            />
                        </div>
                        <div className="pt-2 flex gap-2 justify-end">
                            <button type="button" onClick={() => setIsConfirmCancelOpen(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium py-3 px-6 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className=" font-medium py-2.5 px-6 rounded-lg bg-green-grass hover:bg-lime-700"
                            >
                                {editingId ? "Update Category" : "Save Category"}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Delete Related Expenses Modal */}
                <Modal
                    isOpen={isDeleteExpensesModalOpen}
                    onClose={() => setIsDeleteExpensesModalOpen(false)}
                    title="Related Expenses Found"
                >
                    <div className="space-y-4">
                        <p>Are you sure you want to delete <span className="font-bold">{relatedExpensesCount}</span> expenses in this category.
                            Do you want to delete them as well?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleSkipDeleteExpenses}
                                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                No (Keep expenses)
                            </button>
                            <button
                                onClick={handleConfirmDeleteExpenses}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                                Yes (Delete expenses)
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Confirm Delete"
                >
                    <div className="space-y-4">
                        <p>Are you sure you want to delete this category?</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </ProtectedRoute>
    );
}

