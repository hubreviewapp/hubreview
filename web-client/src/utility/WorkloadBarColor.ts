function BarColor(capacity: number, waiting: number) {
  const workload = (waiting / capacity) * 100;
  return workload > 80 ? "red" : workload > 60 ? "orange" : workload > 40 ? "yellow" : "green";
}

export default BarColor;
