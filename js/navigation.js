const page = document.body.dataset.page;

document.querySelectorAll(".bottom-nav a").forEach(link => {
  if (link.dataset.page === page) {
    link.classList.add("active");
  }
});