
import { motion } from "framer-motion";

interface Props {
  title: string;
  value: string | number;

}

export default function KpiCard({ title, value }: Props) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200"
    >
      <p className="text-slate-500">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </motion.div>
  );
}
